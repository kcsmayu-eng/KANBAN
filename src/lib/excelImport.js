import * as XLSX from 'xlsx'
import { supabase } from './supabaseClient'

/**
 * Parse an Excel file and upsert rows into work_catalog and tasks tables.
 * Expected columns (case-insensitive): work_number, employee, manager
 */
export async function importExcelFile(file, projectId) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (!rows.length) throw new Error('Excel file is empty or unreadable.')

  // Normalize column names
  const normalized = rows.map(r => {
    const entry = {}
    for (const key of Object.keys(r)) {
      entry[key.toLowerCase().replace(/\s+/g, '_')] = r[key]
    }
    return entry
  })

  // Collect unique employee/manager names to resolve UUIDs
  const names = [
    ...new Set([
      ...normalized.map(r => r.employee).filter(Boolean),
      ...normalized.map(r => r.manager).filter(Boolean)
    ])
  ]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('full_name', names)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.full_name, p.id]))

  // Build catalog rows
  const catalogRows = normalized
    .filter(r => r.work_number)
    .map(r => ({
      project_id:  projectId,
      work_number: String(r.work_number),
      employee_id: profileMap[r.employee] ?? null,
      manager_id:  profileMap[r.manager] ?? null
    }))

  // Upsert into work_catalog
  const { error: catError } = await supabase
    .from('work_catalog')
    .upsert(catalogRows, { onConflict: 'project_id,work_number' })

  if (catError) throw catError

  // Get current user id
  const { data: { user } } = await supabase.auth.getUser()

  // Upsert matching tasks (only add new, don't overwrite existing status)
  const taskRows = catalogRows.map(r => ({
    ...r,
    status: 'todo',
    created_by: user?.id
  }))

  const { error: taskError } = await supabase
    .from('tasks')
    .upsert(taskRows, { onConflict: 'project_id,work_number', ignoreDuplicates: true })

  if (taskError) throw taskError

  return catalogRows.length
}
