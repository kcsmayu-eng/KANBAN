import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import SearchDropdown from '@/components/Search/SearchDropdown'
import toast from 'react-hot-toast'

export default function AddTaskModal({ project, onClose, onAdded }) {
  const { profile } = useAuth()
  const [selected, setSelected] = useState(null)
  const [finishDate, setFinishDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!selected) { toast.error('Please select a work number.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').insert({
        project_id:           project.id,
        work_number:          selected.work_number,
        employee_id:          selected.employee?.id ?? null,
        manager_id:           selected.manager?.id ?? null,
        proposed_finish_date: finishDate || null,
        notes:                notes || null,
        created_by:           profile.id
      })
      if (error) throw error
      toast.success('Task added!')
      onAdded?.()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Add Task</h3>

        <label>Work Number</label>
        <SearchDropdown
          projectId={project.id}
          onSelect={r => setSelected(r)}
        />

        {selected && (
          <div className="selected-info">
            <span>Employee: {selected.employee?.full_name ?? '—'}</span>
            <span>Manager: {selected.manager?.full_name ?? '—'}</span>
          </div>
        )}

        <label>Proposed Finish Date</label>
        <input
          type="date"
          value={finishDate}
          onChange={e => setFinishDate(e.target.value)}
        />

        <label>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes…"
          rows={3}
        />

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="btn-primary">
            {loading ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
