import { useState } from 'react'
import { signInWithEmail, signInWithGoogle, signOut } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'

export default function Profile() {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null

  if (user) {
    return (
      <div className="screen-container">
        <h1 className="screen-title">Profile</h1>
        <div className="profile-signed-in">
          <p className="profile-name">{user.displayName || user.email}</p>
          <p className="profile-email">{user.displayName ? user.email : null}</p>
          <button className="btn btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  async function handleEmailSignIn(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code))
      }
    }
  }

  return (
    <div className="screen-container">
      <h1 className="screen-title">Sign In</h1>
      <p className="profile-subtitle">Sign in to sync your progress across devices.</p>

      <form className="profile-form" onSubmit={handleEmailSignIn}>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="email"
        />
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="current-password"
        />
        {error && <p className="profile-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting || !email.trim() || !password.trim()}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="profile-divider">
        <span>or</span>
      </div>

      <button className="btn btn-google" onClick={handleGoogleSignIn}>
        Sign in with Google
      </button>
    </div>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.'
    default:
      return 'Something went wrong. Try again.'
  }
}
