import { createServer } from 'node:http';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
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

const fileEnv = loadEnv();
const APP_USER = process.env.USER || fileEnv.USER || '';
const APP_PASSWORD = process.env.PASSWORD || fileEnv.PASSWORD || '';

if (!APP_USER || !APP_PASSWORD) {
  console.error('FATAL: USER and PASSWORD must be set via env vars or .env file');
  process.exit(1);
}

const COOKIE_SECRET = APP_PASSWORD;
const SESSION_MAX_AGE = 7200;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(UPLOADS_DIR, 'ID_generated');
const PORT = parseInt(process.env.API_PORT || '3001', 10);

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

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

const server = createServer(async (req, res) => {
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
        res.setHeader('Set-Cookie', `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
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
    res.setHeader('Set-Cookie', `session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.url === '/api/save-uniqueid' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
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
    const user = requireAuth(req, res);
    if (!user) return;
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