import { createServer } from 'node:http';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const OUTPUT_DIR = path.join(UPLOADS_DIR, 'ID_generated');
const PORT = parseInt(process.env.API_PORT || '3001', 10);

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  if (req.url === '/api/save-uniqueid' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const fileName = String(payload.fileName || '').trim();
        const content = String(payload.content || '');

        if (!fileName || !content) {
          return sendJson(res, 400, { ok: false, error: 'Missing fileName or content' });
        }

        const safeFileName = fileName.replace(/[\\/]/g, '_');
        const outputPath = path.join(OUTPUT_DIR, safeFileName);

        await mkdir(OUTPUT_DIR, { recursive: true });
        await writeFile(outputPath, content, 'utf8');

        sendJson(res, 200, { ok: true, path: outputPath });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error) });
      }
    });
    return;
  }

  if (req.url === '/api/read-generated' && req.method === 'GET') {
    try {
      await mkdir(OUTPUT_DIR, { recursive: true });
      const files = await readdir(OUTPUT_DIR);
      const csvFiles = files.filter((f) => f.toLowerCase().endsWith('.csv'));

      const fileContents = await Promise.all(
        csvFiles.map(async (fileName) => {
          const filePath = path.join(OUTPUT_DIR, fileName);
          const content = await readFile(filePath, 'utf8');
          return { fileName, content };
        })
      );

      sendJson(res, 200, { ok: true, files: fileContents });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: String(error) });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});