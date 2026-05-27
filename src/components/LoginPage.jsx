import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../App'

export default function LoginPage() {
  const { login, error } = useAuth()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user.trim() || !password.trim()) return
    setSubmitting(true)
    await login(user.trim(), password)
    setSubmitting(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Icon name="dashboard" size={40} />
          <h1>CIO Data Intelligence</h1>
          <p>Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-user">Username</label>
            <input
              id="login-user"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
