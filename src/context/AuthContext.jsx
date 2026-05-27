import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => {
        if (!cancelled && data.ok) setUser(data.user)
      })
      .catch(() => { if (!cancelled) setUser(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (username, password) => {
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, password }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Login failed')
        return false
      }
      setUser(data.user)
      return true
    } catch {
      setError('Network error')
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST' })
    setUser(null)
    setError('')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
