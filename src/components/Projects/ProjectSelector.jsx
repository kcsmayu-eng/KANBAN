import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function ProjectSelector({ onSelect }) {
  const { projects, loading, refresh } = useProjects()
  const { isManager, profile } = useAuth()
  const [newName, setNewName] = useState('')

  console.log('ProjectSelector - Profile:', profile, 'isManager:', isManager)

  async function createProject() {
    if (!newName.trim()) {
      toast.error('Project name is required')
      return
    }
    try {
      const { error } = await supabase
        .from('projects')
        .insert({ name: newName.trim(), manager_id: profile.id })
      if (error) throw error
      setNewName('')
      refresh()
      toast.success('Project created!')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <p className="loading-text">Loading projects…</p>

  return (
    <div className="project-selector">
      <h2>Select a Project</h2>

      {projects.length === 0 && (
        <p className="empty-state">No projects yet. {isManager ? 'Create one below.' : 'Ask your manager to create one.'}</p>
      )}

      <div className="projects-grid">
        {projects.map(p => (
          <button key={p.id} className="project-card" onClick={() => onSelect(p)}>
            <span className="project-name">{p.name}</span>
            {p.description && <span className="project-desc">{p.description}</span>}
          </button>
        ))}
      </div>

      {isManager && (
        <div className="manager-section">
          <h3>Create New Project</h3>
          <div className="new-project-form">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Enter project name"
              onKeyDown={e => e.key === 'Enter' && createProject()}
            />
            <button onClick={createProject}>+ Add Project</button>
          </div>
        </div>
      )}
    </div>
  )
}
