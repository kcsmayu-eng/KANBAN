import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import ProjectSelector from '@/components/Projects/ProjectSelector'

export default function ProjectsPage() {
  const { profile, roleLabel } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="projects-page">
      <header className="app-header">
        <h1>📋 Kanban Board</h1>
        <div className="header-right">
          <span className="user-info">
            Logged in as <strong>{profile?.full_name}</strong> ({roleLabel})
          </span>
          <button onClick={handleSignOut} className="signout-btn">Sign Out</button>
        </div>
      </header>

      <main className="page-content">
        <ProjectSelector onSelect={p => navigate(`/board/${p.id}`, { state: { project: p } })} />
      </main>
    </div>
  )
}
