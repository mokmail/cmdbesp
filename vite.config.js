import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const registerSaveUniqueIdMiddleware = (middlewares) => {
  middlewares.use('/api/save-uniqueid', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
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
        const outputDir = path.join(process.cwd(), 'ID_generated')
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
