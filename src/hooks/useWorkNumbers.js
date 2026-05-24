import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useWorkNumbers(projectId) {
  const [results, setResults] = useState([])

  const search = useCallback(async (query) => {
    if (!projectId || query.length < 2) { setResults([]); return }
    const { data } = await supabase
      .from('work_catalog')
      .select('work_number, employee:employee_id(full_name), manager:manager_id(full_name)')
      .eq('project_id', projectId)
      .ilike('work_number', `${query}%`)
      .limit(8)
    setResults(data ?? [])
  }, [projectId])

  return { results, search }
}
