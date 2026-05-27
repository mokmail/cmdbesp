# Login Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add password-protected login using .env credentials, httpOnly signed cookies, and 2-hour session expiry.

**Architecture:** Backend (server.js) adds POST /api/login, GET /api/me, POST /api/logout endpoints and protects existing API routes with auth middleware. Frontend adds AuthContext + LoginPage component. Vite dev config mirrors the same auth middleware.

**Tech Stack:** Node.js (built-in crypto, http), React (Context + hooks), Vite

---

### Task 1: Add .env to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add .env entry to .gitignore**

Edit `.gitignore` to append `.env`:

```
# Python-generated files
__pycache__/
*.py[oc]
build/
dist/
wheels/
*.egg-info

# Virtual environments
.venv

node_modules/
dist/

# Environment variables
.env
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .env to gitignore"
```

---

### Task 2: Update server.js — auth helpers + endpoints

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add auth imports and helpers at top of file**

Replace the top section of `server.js` (imports + constants) with:

```js
import { createServer } from 'node:http';
import { mkdir, writeFile, readdir, readFile, readFileSync } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHmac, timingSafeEqual } from 'node:crypto';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  try {
    const text = readFileSync(envPath, 'utf8');
    const vars = {};
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      vars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
    return vars;
  } catch {
    return {};
  }
}

const env = loadEnv();
const APP_USER = env.USER || '';
const APP_PASSWORD = env.PASSWORD || '';
const COOKIE_SECRET = APP_PASSWORD || 'fallback-secret';
const SESSION_MAX_AGE = 7200;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(UPLOADS_DIR, 'ID_generated');
const PORT = parseInt(process.env.API_PORT || '3001', 10);
```

- [ ] **Step 2: Add auth helper functions after constants**

```js
function signSession(user) {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${user}:${expiry}`;
  const hmac = createHmac('sha256', COOKIE_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

function verifySession(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon === -1) return null;
    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const expected = createHmac('sha256', COOKIE_SECRET).update(payload).digest('hex');
    if (signature.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const userColon = payload.indexOf(':');
    if (userColon === -1) return null;
    const user = payload.slice(0, userColon);
    const expiry = parseInt(payload.slice(userColon + 1), 10);
    if (Date.now() / 1000 > expiry) return null;
    return user;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  for (const pair of header.split(';')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    cookies[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim();
  }
  return cookies;
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  return verifySession(cookies.session || '');
}

function requireAuth(req, res) {
  const user = getSessionUser(req);
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return null;
  }
  return user;
}
```

- [ ] **Step 3: Add login/me/logout routes before the existing API routes**

In the `createServer` callback, add these routes BEFORE the existing `if (req.url === '/api/save-uniqueid' ...)` checks:

```js
  if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { user, password } = JSON.parse(body || '{}');
        if (!user || !password || user !== APP_USER || password !== APP_PASSWORD) {
          return sendJson(res, 401, { ok: false, error: 'Invalid credentials' });
        }
        const token = signSession(user);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Set-Cookie', `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}`);
        res.end(JSON.stringify({ ok: true, user }));
      } catch (err) {
        sendJson(res, 500, { ok: false, error: String(err) });
      }
    });
    return;
  }

  if (req.url === '/api/me' && req.method === 'GET') {
    const user = getSessionUser(req);
    if (!user) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return sendJson(res, 200, { ok: true, user });
  }

  if (req.url === '/api/logout' && req.method === 'POST') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Set-Cookie', 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    res.end(JSON.stringify({ ok: true }));
    return;
  }
```

- [ ] **Step 4: Protect existing API routes**

Wrap both `/api/save-uniqueid` and `/api/read-generated` handlers with auth check. Change the first route to:

```js
  if (req.url === '/api/save-uniqueid' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    let body = '';
    // ... rest of existing handler unchanged
```

And the second route to:

```js
  if (req.url === '/api/read-generated' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    // ... rest of existing handler unchanged
```

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat: add auth endpoints and protect API routes"
```

---

### Task 3: Update vite.config.js — same auth middleware for dev

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: Add auth middleware to Vite dev server config**

Replace `import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises'` with:

```js
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createHmac, timingSafeEqual } from 'node:crypto'
```

Add env loading and auth helpers after imports (same code as server.js):

```js
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  try {
    const text = readFileSync(envPath, 'utf8')
    const vars = {}
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      vars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
    }
    return vars
  } catch {
    return {}
  }
}

const env = loadEnv()
const APP_USER = env.USER || ''
const APP_PASSWORD = env.PASSWORD || ''
const COOKIE_SECRET = APP_PASSWORD || 'fallback-secret'
const SESSION_MAX_AGE = 7200

function signSession(user) {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = `${user}:${expiry}`
  const hmac = createHmac('sha256', COOKIE_SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${hmac}`).toString('base64url')
}

function verifySession(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const lastColon = decoded.lastIndexOf(':')
    if (lastColon === -1) return null
    const payload = decoded.slice(0, lastColon)
    const signature = decoded.slice(lastColon + 1)
    const expected = createHmac('sha256', COOKIE_SECRET).update(payload).digest('hex')
    if (signature.length !== expected.length) return null
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const userColon = payload.indexOf(':')
    if (userColon === -1) return null
    const user = payload.slice(0, userColon)
    const expiry = parseInt(payload.slice(userColon + 1), 10)
    if (Date.now() / 1000 > expiry) return null
    return user
  } catch {
    return null
  }
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}
```

Add auth routes inside `registerSaveUniqueIdMiddleware`, before the existing `/api/save-uniqueid` handler:

```js
  middlewares.use('/api/login', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      return
    }
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const { user, password } = JSON.parse(body || '{}')
        if (!user || !password || user !== APP_USER || password !== APP_PASSWORD) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: 'Invalid credentials' }))
          return
        }
        const token = signSession(user)
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Set-Cookie', `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}`)
        res.end(JSON.stringify({ ok: true, user }))
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: false, error: String(err) }))
      }
    })
  })

  middlewares.use('/api/me', (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      return
    }
    const cookies = {}
    const header = req.headers.cookie || ''
    for (const pair of header.split(';')) {
      const eqIdx = pair.indexOf('=')
      if (eqIdx === -1) continue
      cookies[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim()
    }
    const user = verifySession(cookies.session || '')
    if (!user) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' })
      return
    }
    sendJson(res, 200, { ok: true, user })
  })

  middlewares.use('/api/logout', (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      return
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Set-Cookie', 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
    res.end(JSON.stringify({ ok: true }))
  })
```

Protect the existing `/api/save-uniqueid` and `/api/read-generated` handlers by adding at the top of each:

```js
    const cookies = {}
    const header = req.headers.cookie || ''
    for (const pair of header.split(';')) {
      const eqIdx = pair.indexOf('=')
      if (eqIdx === -1) continue
      cookies[pair.slice(0, eqIdx).trim()] = pair.slice(eqIdx + 1).trim()
    }
    const user = verifySession(cookies.session || '')
    if (!user) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' })
      return
    }
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.js
git commit -m "feat: add auth middleware to vite dev server"
```

---

### Task 4: Create AuthContext

**Files:**
- Create: `src/context/AuthContext.jsx`

- [ ] **Step 1: Create src/context/AuthContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => {
        if (data.ok) setUser(data.user)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
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
```

- [ ] **Step 2: Commit**

```bash
git add src/context/AuthContext.jsx
git commit -m "feat: create AuthContext with login/logout"
```

---

### Task 5: Create LoginPage component

**Files:**
- Create: `src/components/LoginPage.jsx`

- [ ] **Step 1: Create src/components/LoginPage.jsx**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LoginPage.jsx
git commit -m "feat: create LoginPage component"
```

---

### Task 6: Update App.jsx — wrap with auth

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add import for AuthProvider and useAuth**

Add at top of imports:

```jsx
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
```

- [ ] **Step 2: Create AuthGate wrapper and wrap exports**

Before `export const Icon` line, add the AuthGate component:

```jsx
function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <App />
}
```

- [ ] **Step 3: Replace the default export**

At the very bottom of the file, replace `export default App` with:

```jsx
export default function Root() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wrap app with AuthProvider and AuthGate"
```

---

### Task 7: Add login page CSS styles

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Append login page styles**

Add at the end of `App.css`:

```css
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-primary, #0f1117);
  padding: 1.5rem;
}

.login-card {
  background: var(--bg-card, #1a1d27);
  border: 1px solid var(--border-color, #2a2d3a);
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.4rem;
  margin: 0.75rem 0 0.35rem;
  color: var(--text-primary, #e4e6ef);
}

.login-header p {
  color: var(--text-secondary, #8b8fa3);
  font-size: 0.9rem;
  margin: 0;
}

.login-field {
  margin-bottom: 1.25rem;
}

.login-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary, #8b8fa3);
  margin-bottom: 0.4rem;
}

.login-field input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--border-color, #2a2d3a);
  border-radius: 8px;
  background: var(--bg-input, #13151d);
  color: var(--text-primary, #e4e6ef);
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.login-field input:focus {
  border-color: var(--accent, #4f8cff);
}

.login-error {
  color: #f87171;
  font-size: 0.85rem;
  margin: 0 0 1rem;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  background: var(--accent, #4f8cff);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover {
  background: var(--accent-hover, #3a7bef);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-primary, #0f1117);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color, #2a2d3a);
  border-top-color: var(--accent, #4f8cff);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.css
git commit -m "feat: add login page and loading spinner styles"
```

---

### Task 8: Verify the build

- [ ] **Step 1: Check that the project builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify no lint issues**

```bash
npm run lint
```

Expected: No errors (warnings acceptable).

- [ ] **Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "fix: address lint and build issues"
```
