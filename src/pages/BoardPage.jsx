import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import KanbanBoard from '@/components/Board/KanbanBoard'
import ExcelUpload from '@/components/Upload/ExcelUpload'

export default function BoardPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { profile, isManager, roleLabel } = useAuth()

  const [project, setProject] = useState(state?.project ?? null)
  const [showUpload, setShowUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!project) {
      supabase.from('projects').select('*').eq('id', id).single()
        .then(({ data }) => { if (data) setProject(data) })
    }
  }, [id])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  if (!project) return <div className="loading-screen"><p>Loading project…</p></div>

  return (
    <div className="board-page">
      <header className="app-header">
        <div className="header-left">
          <button onClick={() => navigate('/')} className="back-btn">← Projects</button>
          <h1>{project.name}</h1>
        </div>
        <div className="header-right">
          {isManager && (
            <button
              onClick={() => setShowUpload(v => !v)}
              className="upload-btn"
            >
              📥 Import Excel
            </button>
          )}
          <span className="user-info">
            Logged in as <strong>{profile?.full_name}</strong> ({roleLabel})
          </span>
          <button onClick={handleSignOut} className="signout-btn">Sign Out</button>
        </div>
      </header>

      {showUpload && isManager && (
        <div className="upload-panel">
          <ExcelUpload
            projectId={project.id}
            onImportComplete={() => { setShowUpload(false); setRefreshKey(k => k + 1) }}
          />
        </div>
      )}

      <main className="board-container">
        <KanbanBoard key={refreshKey} project={project} />
      </main>
    </div>
  )
}
