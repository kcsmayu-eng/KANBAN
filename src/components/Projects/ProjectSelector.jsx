import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function ProjectSelector({ onSelect }) {
  const { projects, loading, refresh } = useProjects()
  const { isManager, profile, loading: authLoading } = useAuth()
  const [newName, setNewName] = useState('')

  console.log('ProjectSelector - Profile:', profile, 'isManager:', isManager, 'authLoading:', authLoading)

  // Wait for BOTH auth and projects to load
  const isLoading = loading || authLoading
  const canCreate = !!profile

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

  async function deleteProject(projectId) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
      if (error) throw error
      toast.success('Project removed!')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (isLoading) return <p className="loading-text">Loading projects…</p>

  return (
    <div className="project-selector">
      <h2>Select a Project</h2>

      {projects.length === 0 && (
        <p className="empty-state">No projects yet. Create one below.</p>
      )}

      <div className="projects-grid">
        {projects.map(p => (
          <div key={p.id} className="project-card-wrapper">
            <button className="project-card" onClick={() => onSelect(p)}>
              <span className="project-name">{p.name}</span>
              {p.description && <span className="project-desc">{p.description}</span>}
            </button>
            {isManager && (
              <button
                type="button"
                className="project-delete-btn"
                onClick={e => {
                  e.stopPropagation()
                  deleteProject(p.id)
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {canCreate && (
        <div className="manager-section">
          <h3>Create New Project</h3>
          <p className="project-note">
            {isManager
              ? 'Managers and employees can create projects here. You also have permission to remove existing projects.'
              : 'Employees can create projects here. Only managers can remove existing projects.'}
          </p>
          <div className="new-project-form">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Enter project name"
              onKeyDown={e => e.key === 'Enter' && createProject()}
            />
            <button type="button" onClick={createProject}>+ Add Project</button>
          </div>
        </div>
      )}
    </div>
  )
}
