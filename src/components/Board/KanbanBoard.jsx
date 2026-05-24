import { useState, useEffect } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, closestCorners
} from '@dnd-kit/core'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review',      label: 'Review' },
  { id: 'finished',    label: 'Finished' }
]

export default function KanbanBoard({ project }) {
  const { isManager } = useAuth()
  const [tasks, setTasks] = useState([])
  const [activeTask, setActive] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => { fetchTasks() }, [project.id])

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`tasks:${project.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${project.id}` },
        () => fetchTasks()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [project.id])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, employee:employee_id(full_name), manager:manager_id(full_name)')
      .eq('project_id', project.id)
      .order('created_at')
    setTasks(data ?? [])
  }

  async function handleDragEnd({ active, over }) {
    setActive(null)
    if (!over) return

    const task = tasks.find(t => t.id === active.id)
    const newStatus = over.id // column id

    if (!task || task.status === newStatus) return

    // Permission check: only manager can approve from review → finished
    if (newStatus === 'finished' && task.status === 'review' && !isManager) {
      toast.error('Only managers can approve tasks to Finished.')
      return
    }

    const updates = { status: newStatus }
    if (newStatus === 'review')   updates.finished_at = new Date().toISOString()
    if (newStatus === 'finished') updates.manager_reviewed_at = new Date().toISOString()

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)

    if (error) toast.error(error.message)
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t))
  }

  const byColumn = col => tasks.filter(t => t.status === col)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActive(tasks.find(t => t.id === active.id) ?? null)}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={byColumn(col.id)}
            project={project}
            onRefresh={fetchTasks}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
