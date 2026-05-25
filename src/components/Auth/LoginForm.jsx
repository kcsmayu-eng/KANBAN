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
          password
        })
        if (error) throw error

        let userId = data.user?.id
        let session = data.session
        console.log('Signup response:', { userId, hasSession: !!session, signupData: data })

        // If signup did not automatically create a session, sign the user in now
        if (!session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password
          })
          if (signInError) {
            console.error('Sign-in after signup failed:', signInError)
            throw signInError
          }
          userId = signInData.user?.id
          session = signInData.session
        }

        if (!session) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            console.error('Session fetch after signup failed:', sessionError)
            throw sessionError
          }
          if (sessionData?.session) {
            session = sessionData.session
            userId = session.user?.id || userId
          }
        }

        if (!userId) {
          throw new Error('Unable to determine new user ID after signup.')
        }

        console.log('Creating profile for user:', userId, 'with role:', role)
        
        // Call edge function to create profile (uses service role, bypasses RLS)
        const { data: profileData, error: profileError } = await supabase.functions.invoke(
          'create-profile',
          {
            body: {
              userId,
              fullName: fullName || 'User',
              role
            }
          }
        )
        
        if (profileError) {
          console.error('Profile creation via function error:', profileError)
          throw profileError
        }
        console.log('Profile created:', profileData)

        toast.success('Account created and logged in!')

        setIsSignUp(false)
        setEmail('')
        setPassword('')
        setFullName('')
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
