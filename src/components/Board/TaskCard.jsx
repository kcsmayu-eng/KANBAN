import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { isAfter, parseISO, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function TaskCard({ task, overlay = false, onRefresh }) {
  const { isManager } = useAuth()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  const isDelayed = task.proposed_finish_date &&
    isAfter(new Date(), parseISO(task.proposed_finish_date)) &&
    task.status !== 'finished'

  async function deleteTask() {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) toast.error(error.message)
    else onRefresh?.()
  }

  return (
    <div
      ref={!overlay ? setNodeRef : undefined}
      style={!overlay ? style : {}}
      {...(!overlay ? { ...attributes, ...listeners } : {})}
      className={`task-card ${isDelayed ? 'delayed' : ''} ${task.auto_completed ? 'auto-completed' : ''}`}
    >
      <div className="task-header">
        <span className="work-number">#{task.work_number}</span>
        {isDelayed && <span className="delay-badge">DELAYED</span>}
        {task.auto_completed && <span className="auto-badge">Auto</span>}
      </div>

      <p className="employee-name">{task.employee?.full_name ?? '—'}</p>
      <p className="manager-name">Mgr: {task.manager?.full_name ?? '—'}</p>

      {task.proposed_finish_date && (
        <p className="due-date">
          Due: {task.proposed_finish_date}
          {isDelayed && ` (${formatDistanceToNow(parseISO(task.proposed_finish_date))} overdue)`}
        </p>
      )}

      {task.notes && <p className="task-notes">{task.notes}</p>}

      {isManager && !overlay && (
        <button
          className="delete-btn"
          onClick={e => { e.stopPropagation(); deleteTask() }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
