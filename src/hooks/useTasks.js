import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, employee:employee_id(full_name), manager:manager_id(full_name)')
      .eq('project_id', projectId)
      .order('created_at')
    setTasks(data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  return { tasks, loading, refresh: fetchTasks }
}
