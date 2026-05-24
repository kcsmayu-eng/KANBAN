import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'

export default function KanbanColumn({ column, tasks, project, onRefresh }) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const [showAdd, setShowAdd] = useState(false)
  const { isManager, isEmployee } = useAuth()

  const canAdd = (isManager || isEmployee) && column.id === 'todo'

  return (
    <div className={`kanban-column column-${column.id}`}>
      <div className="column-header">
        <h3>{column.label}</h3>
        <span className="badge">{tasks.length}</span>
      </div>

      <div ref={setNodeRef} className="column-body">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onRefresh={onRefresh} />
          ))}
        </SortableContext>
      </div>

      {canAdd && (
        <button className="add-task-btn" onClick={() => setShowAdd(true)}>
          + Add Task
        </button>
      )}

      {showAdd && (
        <AddTaskModal
          project={project}
          onClose={() => setShowAdd(false)}
          onAdded={onRefresh}
        />
      )}
    </div>
  )
}
