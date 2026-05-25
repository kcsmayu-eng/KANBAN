import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('employee')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Email is optional for signup
        const emailToUse = email.trim() || `user_${Date.now()}@anonymous.local`
        
        const { data, error } = await supabase.auth.signUp({ 
          email: emailToUse, 
          password,
          options: {
            emailRedirectTo: undefined  // Disable email confirmation
          }
        })
        if (error) throw error

        // Insert profile - this should work now with the fixed RLS policy
        if (data.user) {
          console.log('Creating profile for user:', data.user.id, 'with role:', role)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, full_name: fullName, role })
          
          if (profileError) {
            console.error('Profile insert error:', profileError)
            throw profileError
          }
          console.log('Profile created:', profileData)
        }

        // Auto-login after signup (no email confirmation needed)
        const { error: loginError } = await supabase.auth.signInWithPassword({ 
          email: emailToUse, 
          password 
        })
        
        if (loginError) {
          console.error('Auto-login error:', loginError)
          // If auto-login fails, still show success - user can login manually
          toast.success('Account created! You can now log in.')
          setIsSignUp(false)
          setEmail('')
          setPassword('')
          setFullName('')
        } else {
          // Successfully logged in
          toast.success('Account created and logged in!')
          setIsSignUp(false)
          setEmail('')
          setPassword('')
          setFullName('')
        }
      } else {
        if (!email.trim()) {
          toast.error('Email is required for login')
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Logged in!')
      }
    } catch (err) {
      console.error('Auth error:', err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>

      {isSignUp && (
        <>
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </>
      )}

      <input
        type="email"
        placeholder={isSignUp ? "Email (optional)" : "Email"}
        value={email}
        onChange={e => setEmail(e.target.value)}
        required={!isSignUp}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Loading…' : isSignUp ? 'Create Account' : 'Sign In'}
      </button>

      <button type="button" className="link-btn" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </form>
  )
}
