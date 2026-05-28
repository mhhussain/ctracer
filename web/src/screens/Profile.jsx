import { useState } from 'react'
import { signInWithEmail, signInWithGoogle, signInWithMicrosoft, signOut } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'
import { resetProgress } from '../lib/storage'
import Card from '../components/Card'

export default function Profile() {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetState, setResetState] = useState('idle')

  if (loading) return null

  async function handleReset(userArg) {
    setResetState('resetting')
    try {
      await resetProgress(userArg)
      setResetState('done')
      setTimeout(() => setResetState('idle'), 1500)
    } catch {
      setResetState('idle')
    }
  }

  if (user) {
    return (
      <div className="screen-container">
        <h1 className="screen-title">Profile</h1>
        <div style={{ maxWidth: 420 }}>
          <Card>
            <div className="profile-signed-in">
              <p className="profile-name">{user.displayName || user.email}</p>
              <p className="profile-email">{user.displayName ? user.email : null}</p>
              <button className="btn btn-secondary" onClick={signOut}>
                Sign out
              </button>
            </div>

            <div className="profile-danger-zone">
              <p className="profile-danger-label">Danger zone</p>
              {resetState === 'idle' && (
                <button className="btn btn-secondary" onClick={() => setResetState('confirm')}>
                  Reset progress
                </button>
              )}
              {resetState === 'confirm' && (
                <>
                  <p className="profile-reset-warning">
                    ⚠ This will clear all courses, tasks, and project status. This cannot be undone.
                  </p>
                  <button className="btn btn-secondary" onClick={() => setResetState('idle')}>
                    Cancel
                  </button>
                  <button className="btn btn-destructive" onClick={() => handleReset(user)}>
                    Yes, reset everything
                  </button>
                </>
              )}
              {resetState === 'resetting' && (
                <button className="btn btn-destructive" disabled>
                  Resetting…
                </button>
              )}
              {resetState === 'done' && <p>✓ Progress reset.</p>}
            </div>
          </Card>
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

  async function handleMicrosoftSignIn() {
    setError(null)
    try {
      await signInWithMicrosoft()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code))
      }
    }
  }

  return (
    <div className="screen-container">
      <h1 className="screen-title">Sign In</h1>
      <div style={{ maxWidth: 420 }}>
        <Card>
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
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            Sign in with Google
          </button>

          <button className="btn btn-microsoft" onClick={handleMicrosoftSignIn}>
            <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            Sign in with Microsoft
          </button>

          <div className="profile-danger-zone">
            <p className="profile-danger-label">Danger zone</p>
            {resetState === 'idle' && (
              <button className="btn btn-secondary" onClick={() => setResetState('confirm')}>
                Reset progress
              </button>
            )}
            {resetState === 'confirm' && (
              <>
                <p className="profile-reset-warning">
                  ⚠ This will clear all courses, tasks, and project status. This cannot be undone.
                </p>
                <button className="btn btn-secondary" onClick={() => setResetState('idle')}>
                  Cancel
                </button>
                <button className="btn btn-destructive" onClick={() => handleReset(null)}>
                  Yes, reset everything
                </button>
              </>
            )}
            {resetState === 'resetting' && (
              <button className="btn btn-destructive" disabled>
                Resetting…
              </button>
            )}
            {resetState === 'done' && <p>✓ Progress reset.</p>}
          </div>
        </Card>
      </div>
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
