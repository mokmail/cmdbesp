# Login Authentication for CMDBesp Portal

## Overview

Add password-protected login to the CMDBesp portal since it is publicly accessible. Credentials come from a `.env` file, sessions use httpOnly signed cookies with a 2-hour expiry.

## Architecture

### Credential Source

`.env` file at project root with `USER` and `PASSWORD` vars. Loaded at server startup via manual read (no dotenv dependency). `.env` added to `.gitignore`.

### Auth Token

No external dependencies. Token is a colon-joined string `user:expiryUnix` signed with HMAC-SHA256 using the password as the secret, then base64-encoded.

### Cookie

| Property | Value |
|---|---|
| Name | `session` |
| httpOnly | true |
| sameSite | strict |
| path | / |
| maxAge | 7200 (2 hours) |

## API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/login` | No | Validate credentials, set session cookie |
| GET | `/api/me` | Yes | Return `{ok: true, user}` or 401 |
| POST | `/api/logout` | No | Clear session cookie |
| GET | `/api/read-generated` | Yes | Existing — now protected |
| POST | `/api/save-uniqueid` | Yes | Existing — now protected |

### POST /api/login

Request body: `{ user: string, password: string }`

Response 200: `{ ok: true, user }` + sets `session` cookie

Response 401: `{ ok: false, error: "Invalid credentials" }`

### GET /api/me

Reads `session` cookie, validates signature and expiry.

Response 200: `{ ok: true, user }`  
Response 401: `{ ok: false, error: "Unauthorized" }`

## Frontend Components

### AuthContext (`src/context/AuthContext.jsx`)

- Calls `GET /api/me` on mount
- Provides `{ user, login, logout, loading, error }`
- `login(user, password)` calls `POST /api/login`, sets user on success
- `logout()` calls `POST /api/logout`, clears user

### LoginPage (`src/components/LoginPage.jsx`)

- Username + password form
- Matches existing app styling (dark theme)
- Shows error messages on failed login
- Calls `login()` from AuthContext

### App.jsx changes

- Wraps content in AuthProvider
- If `loading` → show centered spinner
- If no `user` → show `<LoginPage />`
- If `user` → show existing app content

## Implementation Order

1. Add `.env` to `.gitignore`
2. Update `server.js` — add env loading, auth helpers, login/me/logout endpoints, protect existing routes
3. Update `vite.config.js` — same auth middleware for dev mode
4. Create `AuthContext.jsx`
5. Create `LoginPage.jsx`
6. Update `App.jsx` — wrap with auth, conditionally render login vs app
7. Verify end-to-end flow
