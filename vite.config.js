import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createHmac, timingSafeEqual } from 'node:crypto'
import path from 'node:path'

const registerSaveUniqueIdMiddleware = (middlewares) => {
  const envPath = path.join(process.cwd(), '.env')
  let APP_USER = process.env.USER || ''
  let APP_PASSWORD = process.env.PASSWORD || ''
  try {
    const text = readFileSync(envPath, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (key === 'USER' && !APP_USER) APP_USER = val
      if (key === 'PASSWORD' && !APP_PASSWORD) APP_PASSWORD = val
    }
  } catch {}

  if (!APP_USER || !APP_PASSWORD) {
    console.error('FATAL: USER and PASSWORD must be set via env vars or .env file')
    process.exit(1)
  }

  const COOKIE_SECRET = APP_PASSWORD
  const SESSION_MAX_AGE = 7200

  const signSession = (user) => {
    const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
    const payload = `${user}:${expiry}`
    const hmac = createHmac('sha256', COOKIE_SECRET).update(payload).digest('hex')
    return Buffer.from(`${payload}:${hmac}`).toString('base64url')
  }

  const verifySession = (token) => {
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

  const sendJson = (res, statusCode, body) => {
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
  }

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
        res.setHeader('Set-Cookie', `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
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
    res.setHeader('Set-Cookie', `session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
    res.end(JSON.stringify({ ok: true }))
  })

  middlewares.use('/api/save-uniqueid', async (req, res) => {
    if (req.method !== 'POST') {
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
    if (!verifySession(cookies.session || '')) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' })
      return
    }

    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}')
        const fileName = String(payload.fileName || '').trim()
        const content = String(payload.content || '')

        if (!fileName || !content) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: 'Missing fileName or content' }))
          return
        }

        const safeFileName = fileName.replace(/[\\/]/g, '_')
        const outputDir = path.join(process.cwd(), 'uploads', 'ID_generated')
        const outputPath = path.join(outputDir, safeFileName)

        await mkdir(outputDir, { recursive: true })
        await writeFile(outputPath, content, 'utf8')

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, path: outputPath }))
      } catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: false, error: String(error) }))
      }
    })
  })

  middlewares.use('/api/read-generated', async (req, res) => {
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
    if (!verifySession(cookies.session || '')) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized' })
      return
    }

    try {
      const outputDir = path.join(process.cwd(), 'uploads', 'ID_generated')
      await mkdir(outputDir, { recursive: true })
      const files = await readdir(outputDir)
      const csvFiles = files.filter((f) => f.toLowerCase().endsWith('.csv'))

      const fileContents = await Promise.all(
        csvFiles.map(async (fileName) => {
          const filePath = path.join(outputDir, fileName)
          const content = await readFile(filePath, 'utf8')
          return { fileName, content }
        })
      )

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true, files: fileContents }))
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: String(error) }))
    }
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'save-uniqueid-files',
      configureServer(server) {
        registerSaveUniqueIdMiddleware(server.middlewares)
      },
      configurePreviewServer(server) {
        registerSaveUniqueIdMiddleware(server.middlewares)
      },
    },
  ],
})
