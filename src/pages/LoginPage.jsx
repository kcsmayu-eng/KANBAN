import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/Auth/LoginForm'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>📋 Kanban Board</h1>
          <p>Manage your work efficiently</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
