# CCS Tabulation System 2026 — Developer Guide

Tabulation system for the **2026 Mr & Ms CCS** pageant (Jose Rizal Memorial State University — College of Computing Studies).

> **⚠️ This repository is a boilerplate.** Both apps install, boot, and talk to a database, but **none of the business features are built yet**. The only working API endpoints are three placeholder `/api/users` routes that are **not** part of the API contract. Read [Section 8 (Gaps & Work Order)](#8-boilerplate-vs-contract--whats-missing) before you start coding — it tells you what to build next and in what order.

**The single source of truth for the API is [`API_Contract_v1_0.md`](./API_Contract_v1_0.md)** (24 endpoints across 8 modules, base path `/api/v1`). If your code and that document disagree, the document wins — or you change the document in a PR and tell the team.

---

## Table of contents

1. [Stack & status at a glance](#1-stack--status-at-a-glance)
2. [Prerequisites](#2-prerequisites)
3. [Quick start](#3-quick-start)
4. [Project structure](#4-project-structure)
5. [Backend guide (Express + Mongoose)](#5-backend-guide-express--mongoose)
6. [Frontend guide (Vue 3 + Vite + Tailwind)](#6-frontend-guide-vue-3--vite--tailwind)
7. [The API contract at a glance](#7-the-api-contract-at-a-glance)
8. [Boilerplate vs contract — what's missing](#8-boilerplate-vs-contract--whats-missing)
9. [Open questions to settle with the project lead](#9-open-questions-to-settle-with-the-project-lead)
10. [Scoring domain rules](#10-scoring-domain-rules)
11. [Team workflow](#11-team-workflow)
12. [Troubleshooting](#12-troubleshooting)
13. [Reference links](#13-reference-links)

---

## 1. Stack & status at a glance

| Layer | Technology | Version | Status in this repo |
| --- | --- | --- | --- |
| Backend | Node.js + Express (ESM) | Express `5.2.1` | ✅ Runs — scaffold only (1 model, 3 placeholder routes) |
| Database | MongoDB + Mongoose | Mongoose `9.10.2`, driver `7.6.0` | ✅ Connection wired, **no feature schemas yet** |
| Backend tooling | cors `2.8.6`, morgan `1.12.1`, dotenv `18.0.3`, nodemon `3.1.14` | — | ✅ Configured |
| Frontend | Vue 3 (Composition API) | Vue `3.5.43` | ✅ Runs — single demo page (`App.vue`) |
| Build | Vite | Vite `8.3.1` | ✅ `dev` / `build` / `preview` all work |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | `4.3.3` | ✅ Imported globally, **not used in any component yet** |
| HTTP client | axios | `1.20.0` | ⚠️ Installed but unused — no API layer exists |
| Routing / state | vue-router, Pinia | — | ❌ Not installed |
| Auth | JWT + password hashing | — | ❌ Not implemented (passwords currently stored **in plain text**) |
| Tests / linting | — | — | ❌ None. `npm test` in `backend/` intentionally exits with an error |
| Mock API | `/api/v1-mock` | — | ❌ Referenced by the contract, **does not exist in the repo** |

**What was verified on this checkout (2026-09-25):** `npm ci` succeeds in both folders; `npm run build` in `frontend/` produces a working `dist/`; `npm run dev` serves the app on `http://localhost:5173`; `npm run dev` in `backend/` starts nodemon and waits for MongoDB. The API was **not** exercised end-to-end because no MongoDB instance was available in the test environment.

---

## 2. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | **`^22.18.0` or `>=24.12.0`** | Hard requirement — declared in `frontend/package.json` → `engines`. Node 22 LTS is the safest choice. Check with `node -v`. |
| **npm** | 10+ | Ships with Node 22. |
| **MongoDB** | 7.x+ | Local install, Docker, or **MongoDB Atlas** (free tier is fine for development). The backend will not start without it. |
| **Git** | any recent | `git pull --rebase` is used in the workflow below. |
| **VS Code + "Vue (Official)" extension** | — | Recommended workspace setup; `frontend/.vscode/extensions.json` already suggests it. Disable the old *Vetur* extension if you have it. |
| **API client** | — | Postman, Insomnia, or the VS Code *Thunder Client* extension — you'll need one to test endpoints. |

---

## 3. Quick start

Run the backend and the frontend in **two separate terminals**, and keep both running while you work.

### 3.1 Backend

```bash
cd backend
npm install
cp .env.example .env          # Windows PowerShell: copy .env.example .env
npm run dev
```

Expected output once MongoDB is reachable:

```
MongoDB Connected: 127.0.0.1
Server running in development mode on port 3000
```

Smoke test — open a third terminal:

```bash
curl http://localhost:3000/
# {"message":"API is running..."}
```

If the process sits silently for ~30 seconds and then prints `Database Connection Error: ...`, your database isn't running. See [Troubleshooting](#12-troubleshooting).

**Getting a database quickly** — pick one:

```bash
# Option A: Docker (recommended for local dev)
docker run -d --name ccs-mongo -p 27017:27017 mongo:7

# Option B: local install — service name is usually mongod / mongodb-org
# Option C: MongoDB Atlas — paste the SRV string into MONGO_URI in backend/.env
```

`backend/.env` contents:

```ini
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/express_mvc_db
```

### 3.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is served at **http://localhost:5173** (Vite's default) and shows the boilerplate welcome card.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot-module reload |
| `npm run build` | Production bundle into `frontend/dist/` |
| `npm run preview` | Serves the built bundle locally, to check the production build |

### 3.3 Backend-only alternative

If you just want the API on a machine without nodemon, run the entry file directly:

```bash
cd backend && node src/server.js
```

> There is no `npm start` script yet — add `"start": "node src/server.js"` to `backend/package.json` when you get to deployment.

---

## 4. Project structure

```
ccs-tabulation-2026-project/
├── API_Contract_v1_0.md        # ← THE API SPEC (v1.0). Read this first.
├── README.md                   # ← you are here
├── .gitignore                  # ignores .env, node_modules, .nuxt
│
├── backend/
│   ├── .env.example            # template — copy to .env, never commit .env
│   ├── package.json            # "type": "module" → ESM. Scripts: dev, test (stub)
│   └── src/
│       ├── server.js           # app entry: middleware + ALL routes inline + 404 + listen
│       ├── config/
│       │   └── db.js           # connectDB() — mongoose.connect(MONGO_URI)
│       ├── models/
│       │   └── User.js         # only model: username, password, userType, names, isActive
│       └── controllers/
│           └── userController.js  # getUsers, createUser, getUserById
│
└── frontend/
    ├── index.html              # Vite HTML entry (title is still "Vite App")
    ├── vite.config.js          # vue + devtools + tailwind plugins, @ alias, server config
    ├── jsconfig.json           # @/* → ./src/* (editor autocomplete only)
    ├── package.json            # Vue 3 + Vite 8 + Tailwind 4 + axios
    ├── README.md               # Vue/Vite scaffold notes (IDE + Vue DevTools setup)
    ├── public/favicon.ico
    └── src/
        ├── main.js             # createApp(App).mount('#app') + global CSS import
        ├── App.vue             # the entire UI right now (demo counter card)
        └── assets/css/main.css # single line: @import "tailwindcss";
```

### What does *not* exist yet (and where you'd normally put it)

| Missing | Conventional location | Why it's needed |
| --- | --- | --- |
| Route definitions | `backend/src/routes/*.js` | Keep `server.js` from growing into a 200-line route list |
| Auth / role / validation middleware | `backend/src/middleware/*.js` | JWT verification, Admin-vs-Judge guards, request validation |
| Response helpers & error handler | `backend/src/utils/response.js` | Guarantees the contract's response envelope everywhere |
| Business logic / calculations | `backend/src/services/*.js` | Scoring & ranking math lives outside controllers |
| Feature schemas | `backend/src/models/*.js` | `Category`, `ContestantGroup`, `Contestant`, `Score`, `Configuration` |
| Mock API | `backend/src/mock/*.js` | Implements the contract's `/api/v1-mock` so the frontend isn't blocked |
| Pages & components | `frontend/src/views/`, `components/` | Admin, Judge, and Projection screens |
| Router & stores | `frontend/src/router/`, `stores/` | Multi-screen navigation, shared auth/live-status state |
| API layer | `frontend/src/services/api.js` | One axios instance instead of `fetch` scattered in components |
| Tests | `backend/tests/`, `frontend/src/**/*.spec.js` | Nothing is covered today |

---

## 5. Backend guide (Express + Mongoose)

### 5.1 How a request flows today

```
HTTP request
   │
   ├─ express.json()        parse JSON body
   ├─ cors()                allow all origins (wide open — tighten before production)
   ├─ morgan('dev')         request logging (skipped when NODE_ENV=production)
   │
   ├─ route matched in server.js ──► controller (src/controllers) ──► Mongoose model (src/models) ──► MongoDB
   │                                                                          │
   │                                                                   JSON response (res.json)
   │
   └─ no route matched ──► 404 handler ──► {"success":false,"message":"Route not found"}
```

`connectDB()` is called **before** `app.listen()`, so the API does not accept traffic until MongoDB connects, and a connection failure calls `process.exit(1)`.

### 5.2 Conventions you must follow

1. **ESM only.** `backend/package.json` sets `"type": "module"`. There is no `require()`.
2. **Always write the `.js` extension in relative imports:** `import { User } from '../models/User.js'`. Omitting it throws `ERR_MODULE_NOT_FOUND` at runtime (Node does not guess extensions).
3. **One file per resource** in `controllers/`, one schema per file in `models/`. Match the file naming already used (`userController.js`, `User.js`).
4. **Every database call goes in `try/catch`.** The current pattern returns `400` for controller errors and `500` for unexpected failures — see below for how that maps to the contract.
5. **`return` on every early exit.** `getUserById` shows the pattern: `return res.status(404)...` — without `return`, execution continues and you'll hit `ERR_HTTP_HEADERS_SENT`.
6. **Never pass `req.body` straight into a model.** `createUser` does `User.create(req.body)`, which lets a client set any field on the document (including `userType: "Admin"`). Pick fields explicitly, or strip them first.

### 5.3 The response envelope (contract-mandated)

The contract defines one shape for success and one for errors. **The current code does not match it** — see the comparison below.

**Target (contract):**

```jsonc
// Success
{ "success": true, "message": "Operation successful", "data": { } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable description", "details": [] } }
```

| | Current boilerplate | Contract requires |
| --- | --- | --- |
| Success body | `{ success: true, data }` (no `message`) | `{ success: true, message, data }` |
| Error body | `{ success: false, message }` (flat) | `{ success: false, error: { code, message, details } }` |
| Error codes | none | `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `DUPLICATE_KEY`, `INTERNAL_SERVER_ERROR`, `INVALID_CREDENTIALS`, `SCORE_EXCEEDS_MAX` |
| HTTP statuses | 200 / 201 / 400 / 404 / 500 | 400 / 401 / 403 / 404 / 409 / 500 |

**Recommended first backend task:** create `backend/src/utils/response.js` and use it everywhere, so no one has to think about the envelope again:

```js
// backend/src/utils/response.js
export const sendSuccess = (res, data = null, message = 'Operation successful', status = 200) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null && data !== undefined) body.data = data;
  return res.status(status).json(body);
};

export const sendError = (res, status, code, message, details = []) =>
  res.status(status).json({ success: false, error: { code, message, details } });
```

Then add a single error handler in `server.js` — **after** all routes and **after** the 404 handler, with exactly four parameters:

```js
// backend/src/server.js — register this last
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError')            // Mongoose schema validation
    return sendError(res, 400, 'VALIDATION_ERROR', err.message);
  if (err.name === 'CastError')                  // bad ObjectId in /:id
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format');
  if (err.code === 11000)                        // unique index violation
    return sendError(res, 409, 'DUPLICATE_KEY', 'Duplicate value');

  console.error(err);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Something went wrong');
});
```

> Express 5 automatically forwards rejected promises from `async` handlers to error middleware, so a `throw` inside a controller reaches the block above. You can still use `try/catch` if you prefer explicit control — just be consistent across the codebase.

### 5.4 Recipe: adding a new resource (worked example — Categories)

Follow these four steps for every module in the contract. This example implements `GET/POST /api/v1/categories` from §4 of the contract.

**Step 1 — model** (`backend/src/models/Category.js`). Note the embedded `rubrics` sub-schema and the weight bounds the contract's error example implies:

```js
import mongoose from 'mongoose';

const rubricSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  maxPoints: { type: Number, required: true, min: 1 },
});

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    weight: { type: Number, required: true, min: 0, max: 100 }, // contract: 0–100
    isActive: { type: Boolean, default: true },
    rubrics: [rubricSchema],
  },
  { timestamps: true }   // required on every schema by the contract
);

export const Category = mongoose.model('Category', categorySchema);
```

**Step 2 — controller** (`backend/src/controllers/categoryController.js`): thin, delegating to the model, using the response helpers.

```js
import { Category } from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getCategories = async (req, res) => {
  const categories = await Category.find().lean();
  return sendSuccess(res, categories, null);   // contract §4.1 returns data only
};

export const createCategory = async (req, res) => {
  const { name, description, weight, isActive, rubrics } = req.body;  // pick fields explicitly
  if (!name) return sendError(res, 400, 'VALIDATION_ERROR', 'name is required',
    [{ field: 'name', issue: 'Must be a non-empty string' }]);

  const category = await Category.create({ name, description, weight, isActive, rubrics });
  return sendSuccess(res, category, 'Category created successfully', 201);
};
```

**Step 3 — routes** (`backend/src/routes/categoryRoutes.js`), then mount it in `server.js`:

```js
import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';

const router = Router();
router.get('/', getCategories);
router.post('/', createCategory);

export default router;
```

```js
// server.js
import categoryRoutes from './routes/categoryRoutes.js';

app.use('/api/v1/categories', categoryRoutes);
// (moving the existing /api/users routes into src/routes/userRoutes.js is a good first PR)
```

**Step 4 — test it.** With MongoDB running:

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Playsuit","description":"Physique, poise and presentation.","weight":10,
       "rubrics":[{"name":"Fitness & Form","maxPoints":40},{"name":"Stage Presence","maxPoints":40},{"name":"Poise & Bearing","maxPoints":20}]}'

curl http://localhost:3000/api/v1/categories
```

### 5.5 Environment variables

| Variable | Required | Current value | Notes |
| --- | --- | --- | --- |
| `PORT` | no | `3000` | Code falls back to `5000` if unset — the `.env` value wins. Keep backend and frontend ports distinct. |
| `MONGO_URI` | **yes** | `mongodb://127.0.0.1:27017/express_mvc_db` | ⚠️ The contract calls this `MONGODB_URI`. **Pick one name and tell the team** — right now the docs and the code disagree. |
| `NODE_ENV` | no | *(unset)* | Set to `production` to silence morgan. |
| `JWT_SECRET` | **yes, once auth is built** | *(missing)* | Contract requires it. Never commit the real value; add it to `.env.example` as a placeholder. |
| `JWT_EXPIRES_IN` | when auth is built | *(missing)* | Contract's login response returns `expiresAt`, so expiry must be configured. |

**Rules:** `.env` is gitignored — keep it that way. Whenever you add a variable, **update `.env.example` in the same PR** so the next teammate can boot the project.

### 5.6 Version caveats

Express **5** and Mongoose **9** are recent majors, and most tutorials/StackOverflow answers you'll find target Express 4 / Mongoose 7–8. Symptoms of copying old code: `mongoose.connect(uri, { useNewUrlParser: true })` (options removed), callback-style queries (`.find(cond, cb)`), and `res.send(status, body)`. **Check the official docs for the installed major version** before pasting anything.

---

## 6. Frontend guide (Vue 3 + Vite + Tailwind)

### 6.1 Entry chain

```
index.html
  └─ <div id="app">  ──►  src/main.js  ──► createApp(App).mount('#app')
                              │
                              ├─ imports src/assets/css/main.css  → @import "tailwindcss";
                              └─ renders src/App.vue  (the whole app today)
```

### 6.2 Conventions

- **Use `<script setup>`** (Composition API) — that's what `App.vue` uses, and it's the current Vue default. Don't mix in Options API files.
- **`@` is an alias for `src/`**, configured in both `vite.config.js` (so the bundler resolves it) and `jsconfig.json` (so your editor autocompletes it). Import as `import Foo from '@/components/Foo.vue'`.
- **Tailwind v4 works differently from v3.** The only setup needed is `@import "tailwindcss";` in `src/assets/css/main.css` plus the `@tailwindcss/vite` plugin. Do **not** create `tailwind.config.js` or `postcss.config.js` the way v3 tutorials show — v4 configures theme values with `@theme { ... }` inside CSS. (`postcss` and `autoprefixer` are listed in `devDependencies` but the Vite plugin handles both; they're scaffold leftovers.)
- **Pick one styling system per component.** `App.vue` currently uses a `<style scoped>` block with plain CSS (`.welcome-card`, `.btn.primary`, …) alongside Tailwind. When you replace the demo page, delete that scoped block and use utility classes so we don't end up with two competing systems.
- **Two cosmetic things worth fixing early:** `frontend/package.json` has `"name": "package.json"` (looks wrong in every log line — rename it, e.g. `"ccs-tabulation-frontend"`), and `index.html` has `<title>Vite App</title>`.
- **No router or store yet — and that's fine until you need them.** Add `vue-router@4` when you build your second screen; add Pinia only when two distant components genuinely need the same state (auth user, live status). Don't install them speculatively.

### 6.3 Wiring the frontend to the API (recommended structure)

`axios` is installed but nothing imports it. Create a single API layer instead of calling `axios`/`fetch` inside components.

**Step 1 — a Vite dev proxy** so `/api` requests reach the backend and you avoid CORS entirely in development. Add to `vite.config.js`:

```js
server: {
  host: true,
  allowedHosts: ['.e2b.app'],   // see §6.4
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true },
  },
},
```

**Step 2 — one axios instance** (`src/services/api.js`) that attaches the token and unwraps the contract's envelope:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,          // unwrap { success, message, data } → data
  (error) => {
    const payload = error.response?.data?.error;
    if (error.response?.status === 401) {
      localStorage.removeItem('token'); // TODO: redirect to the login screen
    }
    return Promise.reject({
      code: payload?.code || 'NETWORK_ERROR',
      message: payload?.message || error.message,
      details: payload?.details || [],
    });
  }
);

export default api;
```

**Step 3 — one module per contract area**, e.g. `src/services/authService.js`:

```js
import api from './api.js';

export const login = (username, password) => api.post('/auth/login', { username, password });
export const logout = () => api.post('/auth/logout');
```

Notes:

- Environment variables must start with **`VITE_`** to be visible in the browser (`frontend/.env` → `VITE_API_BASE_URL=http://localhost:3000/api/v1`). Only put non-secrets there — anything in the bundle is public.
- Prefer the relative `/api/v1` base URL + proxy. It keeps working when the app is served from another machine or domain, and it's the only option that works when the browser isn't running on the same host as the backend.
- If you point directly at the backend instead, remember CORS is currently wide open (`app.use(cors())`), which is convenient for dev and not acceptable for production.

### 6.4 Dev-server config (already applied)

`vite.config.js` sets:

```js
server: {
  host: true,                 // listen on all interfaces, not just localhost
  allowedHosts: ['.e2b.app'], // allow the hosted preview domain
},
```

Vite rejects requests whose `Host` header it doesn't recognise (a security feature), which breaks access from other devices, tunnels, and hosted preview URLs. The allowlist above keeps that protection active while permitting the hosted sandbox domain — **add your own tunnel/LAN domain to the array if you need remote access**. `localhost`, `127.0.0.1` and LAN IPs are allowed by default.

---

## 7. The API contract at a glance

Base path **`/api/v1`** · auth header **`Authorization: Bearer <token>`** · JSON only.
Auth is required on every endpoint except `POST /auth/login`.

Legend for **Status**: ❌ not started · 🟡 partially exists in the boilerplate · 🧪 mock pending.

| # | Method | Endpoint | Who | Purpose | Status |
| --- | --- | --- | --- | --- | --- |
| **Auth** | | | | | |
| 1.1 | POST | `/auth/login` | public | Authenticate, return token + user + `expiresAt` | ❌ |
| 1.2 | POST | `/auth/logout` | any | Invalidate session token | ❌ |
| **Configuration** | | | | | |
| 2.1 | GET | `/configuration` | Admin | Event title/description, mode, quick stats, live status | ❌ |
| 2.2 | PUT | `/configuration` | Admin | Update event title & description | ❌ |
| 2.3 | PATCH | `/configuration/live-status` | Admin | Set the active category & contestant (drives judge + projection screens) | ❌ |
| **Judges** | | | | | |
| 3.1 | GET | `/judges` | Admin | List judges | 🟡 `GET /api/users` returns all users incl. admins |
| 3.2 | POST | `/judges` | Admin | Create judge account | 🟡 `POST /api/users` (allows any `userType`) |
| 3.3 | PUT | `/judges/:id` | Admin | Update judge details / credentials / active flag | ❌ |
| 3.4 | DELETE | `/judges/:id` | Admin | Delete judge | ❌ |
| **Categories & rubrics** | | | | | |
| 4.1 | GET | `/categories` | Admin | List categories with embedded rubrics | ❌ |
| 4.2 | POST | `/categories` | Admin | Create category + rubrics | ❌ |
| 4.3 | PUT | `/categories/:id` | Admin | Update category / add / edit / remove rubrics | ❌ |
| 4.4 | DELETE | `/categories/:id` | Admin | Delete category (blocked if linked to active groups) | ❌ |
| **Contestant groups** | | | | | |
| 5.1 | GET | `/contestant-groups` | Admin | List groups + `categoriesIncluded` | ❌ |
| 5.2 | POST | `/contestant-groups` | Admin | Create group, map categories | ❌ |
| 5.3 | PUT | `/contestant-groups/:id` | Admin | Update group name / category mapping | ❌ |
| 5.4 | DELETE | `/contestant-groups/:id` | Admin | Delete group (blocked if it has contestants) | ❌ |
| **Contestants** | | | | | |
| 6.1 | GET | `/contestants?groupId=` | Admin | List contestants, optional group filter | ❌ |
| 6.2 | POST | `/contestants` | Admin | Register contestant | ❌ |
| 6.3 | PUT | `/contestants/:id` | Admin | Update contestant | ❌ |
| 6.4 | DELETE | `/contestants/:id` | Admin | Delete contestant | ❌ |
| **Judge scoring** | | | | | |
| 7.1 | GET | `/scores/live-sheet` | Judge | Categories + active contestant + **this judge's** saved scores | ❌ |
| 7.2 | POST | `/scores/submit` | Judge | Submit/update scores (validated against `maxPoints`) | ❌ |
| **Reports & print** | | | | | |
| 8.1 | GET | `/reports/voting-progress` | Admin | Completion % per judge | ❌ |
| 8.2 | GET | `/reports/final-rankings?groupId=` | Admin | Ranked final scores per group | ❌ |
| 8.3 | GET | `/reports/paper/final-ranking-sheet?groupId=` | Admin | Print-ready final ranking data | ❌ |
| 8.4 | GET | `/reports/paper/judge-scoresheet/:judgeId` | Admin | Print-ready per-judge scoresheet | ❌ |

### Interpreting the contract

- **Two base URLs are declared:** `/api/v1` (real) and `/api/v1-mock` (for development while the backend is unfinished). **There is no mock implementation in this repo** — either build one or point the frontend at the real API. Building the mock early is a good use of one sprint: it unblocks the entire frontend team without waiting on MongoDB work.
- **Judge identity comes from the token, not the request.** `GET /scores/live-sheet` returns *the requesting judge's* saved scores, and `POST /scores/submit` has no `judgeId` field. Never let the client claim to be another judge.
- **`Score` is an upsert:** §7.2 says "submits or updates", so re-submitting for the same category + contestant must overwrite, not create duplicates. Plan a unique compound index on `(judgeId, categoryId, contestantId)`.
- **Print endpoints return data, not files.** §8.3/§8.4 return structured JSON "formatted for printing"; the frontend is responsible for rendering/PDF. There is no PDF generator, no template, and no print CSS anywhere yet.
- **Deletes have guards:** the contract expects `400 VALIDATION_ERROR` when deleting a category that groups still reference, or a group that still has contestants. Implement those checks explicitly.
- **`isConfigurationMode` is returned by §2.1 but no endpoint sets it.** Either add one (e.g. `PATCH /configuration/mode`) or the flag is decorative — decide with the lead.

---

## 8. Boilerplate vs contract — what's missing

Current reality: **3 unversioned placeholder routes** (`/api/users`) versus **24 contract endpoints**. Nothing else is built.

### Critical: security gaps in the existing code

These are in the code today and must be fixed before anything is shared beyond the team:

| Issue | Where | Fix |
| --- | --- | --- |
| **Passwords stored and returned in plain text** | `models/User.js` (no hashing), `userController.js` (`User.find()` returns every field) | Hash with `bcrypt` in a Mongoose `pre('save')` hook; set `password: { select: false }` |
| **Mass assignment** | `createUser` → `User.create(req.body)` | Whitelist the accepted fields; force `userType` server-side |
| **No authentication at all** | `server.js` | JWT login/logout + a verification middleware; contract requires Bearer tokens |
| **No role enforcement** | `server.js` | Admin/Judge guards returning `403 FORBIDDEN` (`User.userType` already exists but is never checked) |
| **CORS allows every origin** | `app.use(cors())` | Restrict to the frontend origin(s) via an env var before deployment |
| **Error responses leak internals** | controllers return `error.message` verbatim | Map errors to contract codes; log details server-side only |

### Structural gaps

1. **No `/api/v1` prefix.** Routes are `/api/users`; the contract is versioned. Introduce the prefix once, before more routes exist.
2. **Routes live inline in `server.js`.** Move to `src/routes/` as endpoints multiply.
3. **Response envelope doesn't match the contract** (see §5.3) — no `message` on success, errors are flat instead of `{ error: { code, message, details } }`, and contract codes like `DUPLICATE_KEY` / `RESOURCE_NOT_FOUND` aren't used.
4. **Missing models:** `Configuration`, `Category`, `ContestantGroup`, `Contestant`, `Score`. Only `User` exists.
5. **No validation layer.** Required fields, ObjectId format, `weight` 0–100, and `score ≤ maxPoints` (`SCORE_EXCEEDS_MAX`) all have dedicated contract errors but no implementation.
6. **No calculation/report layer.** The scoring formulas (see §10) belong in `src/services/`, not in controllers.
7. **No mock API** for `/api/v1-mock`.
8. **Frontend has no router, no API layer, no auth guard, no admin/judge/projection screens.**
9. **No tests or linting.** `npm test` in `backend/` fails by design; there's no `lint` script in either app. At minimum, add a smoke test for the scoring math — it's the part that must be provably correct on event night.
10. **No production story.** No `start` script, no `NODE_ENV=production` guidance, no deployment config, no database seed script (you'll want one to demo/develop without hand-entering judges and contestants).

### Suggested build order

Dependencies dictate the sequence — each phase unblocks the next:

| Phase | Deliverable | Why first |
| --- | --- | --- |
| **0** | Response helpers + central error handler + `/api/v1` prefix + `src/routes/` | Every later endpoint depends on these; cheap to do now, expensive to retrofit |
| **1** | **Auth**: `bcrypt` hashing, `POST /auth/login`, `POST /auth/logout`, JWT middleware, role guards | Everything except login is authenticated; also fixes the plain-text password exposure |
| **2** | **Configuration** endpoints + `isConfigurationMode` | Drives the whole live experience and the projection screen |
| **3** | **Admin CRUD**: categories/rubrics → contestant groups → contestants (in that order — groups reference categories, contestants reference groups) | You cannot enter scores without contestants and rubrics |
| **4** | **Judge scoring**: `live-sheet` + `submit` with `maxPoints` validation | Core of the event; needs phase 3 |
| **5** | **Reports**: voting progress, final rankings, print sheets + the calculation service | Needs real score data; depends on the open questions in §9 |
| **6** | **Frontend screens**: login → admin CRUD → judge scoring sheet → projection/print views | Can start earlier against the **mock API** 🧪 |
| **Parallel** | `backend/src/mock/` implementing `/api/v1-mock`, seed script, tests | Unblocks frontend work from day one |

### Definition of done for any endpoint

- [ ] Path, method, and role match `API_Contract_v1_0.md` (or the contract was updated in the same PR)
- [ ] Response uses the standard success/error envelope and the contract's error codes
- [ ] Auth + role check applied
- [ ] Input validated; invalid ObjectId, missing fields, and out-of-range numbers return `400`
- [ ] Verified manually with curl/Postman, including the error cases
- [ ] `.env.example` and the contract updated if behaviour changed
- [ ] Reviewed by one other teammate

---

## 9. Open questions to settle with the project lead

These are genuinely undefined in the contract and will cause rework if the team guesses differently. Settle them **before** building phases 4–5.

1. **Are scores averaged across judges?** §7.2 stores one score set per judge, but §8.2's `final_candidate_score` never says whether it sums or averages judges. (In the contract's §8.2 example, `rawScore: 91.0` equals one judge's rubric total of 38+35+18, which *suggests* an average — but confirm.)
2. **Is `final_candidate_score` a weighted total or a percentage?** With the contract's formula it's a weighted total capped by the sum of category weights. Its example is internally inconsistent: weights 10 + 10 with weighted scores 9.1 + 9.0 = **18.1**, yet it prints **95.0**. Must the weights in a group sum to 100? Does the UI renormalize?
3. **Tie-breaking.** No rule for equal final scores. Highest score in the highest-weighted category? Drop the lowest category? Shared rank? Decide now — event night is too late.
4. **What does `isConfigurationMode` actually do?** Does it lock scoring, hide the judge screen, or just change what the projection shows? There's no endpoint to toggle it either.
5. **Exactly which role may call each endpoint.** Only §3.1 documents a `403` (judges list = Admin). Does a Judge need read access to `/configuration` or `/scores/live-sheet` (the latter clearly yes, but it isn't stated)?
6. **Score editing policy.** Can a judge change a score after submitting (the contract implies yes, via upsert)? Is there a lock once the category closes, and who can unlock? Everything is auditable only if `updatedAt` is tracked — decide whether an audit trail of score changes is required for the event.
7. **Do rubrics have to total 100 per category?** The examples do (40 + 40 + 20), but nothing enforces or states it.
8. **Delete vs deactivate.** Both `User` and (per contract) categories have `isActive`, yet the contract specifies hard `DELETE` endpoints. Which is the real removal path once scores exist? Deleting a contestant who already has scores would corrupt reports.
9. **Documentation drifts to fix:** `MONGO_URI` (code) vs `MONGODB_URI` (contract); §6.1 returns `group` as an object `{_id, name}` while §6.2/§6.3 return it as a raw id string; `nameAndLabel` formats differ between §8.3 (`"1st Year - Jopeta Mari"`) and §8.4 (`"First Year - Jopeta Mari"`).

---

## 10. Scoring domain rules

From §8 of the contract — these formulas are the heart of the system:

```
rubrics_total        = Σ scores of every rubric in the category
category_weighted    = rubrics_total × (category.weight ÷ 100)
final_candidate_score = Σ category_weighted across all categories in the group
```

**Worked example** (hand-computable, use it as your unit-test fixture):

| Piece | Value |
| --- | --- |
| Category *Playsuit*, weight | `10` |
| Rubrics → judge's scores | Fitness & Form 38/40 · Stage Presence 35/40 · Poise & Bearing 18/20 |
| `rubrics_total` | 38 + 35 + 18 = **91** |
| `category_weighted` | 91 × 10 ÷ 100 = **9.1** |
| Category *Evening Gown*, weight 10 → judge scored 90 | weighted = 90 × 10 ÷ 100 = **9.0** |
| `final_candidate_score` (2 categories) | 9.1 + 9.0 = **18.1** |

Two things this example makes obvious:

- The final score is a **weighted total, not a percentage**. Its ceiling is the sum of the group's category weights (here 20 → max 20). Normalize the weights to 100 if you want a 0–100 display.
- **Never hardcode the numbers from the contract's examples in tests** — §8.2's example doesn't follow its own formula. Derive expected values by hand (or in a test) from the formulas above.

Implementation notes:

- Keep the math in `backend/src/services/` (e.g. `scoringService.js`) as pure functions taking plain objects, so it can be unit-tested without a database.
- Round only for **display**, never mid-calculation; floating-point drift shows up as tie-breaks flipping.
- Compute rankings server-side (§8.2 returns `rank`) so admin, projection, and print always agree.
- `score ≤ rubric.maxPoints` must be enforced on submit, returning `400 SCORE_EXCEEDS_MAX` with `{ rubricsId, givenScore, maxPoints }` in `details`.

---

## 11. Team workflow

### Branches & pull requests

- **Never commit directly to `main`.** It's the deployable branch and is kept working at all times.
- Branch per task: `feature/<module>-<short-description>` (e.g. `feature/auth-jwt-login`, `feature/admin-categories`, `feature/judge-live-sheet`).
- Keep a PR scoped to **one module or fix**. A 40-file PR can't be reviewed properly.
- Before opening a PR: `git fetch && git pull --rebase origin main`, then confirm both apps still build/run.
- Every PR needs **one reviewer**, and should describe: what changed, how to test it, and any contract deviation.

### Commits

Use short, prefixed messages so history is readable:

```
feat(auth): add JWT login and role guard middleware
fix(scores): reject rubric scores above maxPoints
docs(api): clarify final score calculation
chore(frontend): add axios api layer and vite proxy
```

### Commit / don't commit

| ✅ Commit | ❌ Never commit |
| --- | --- |
| `package.json` **and** `package-lock.json` (keep them in sync when adding a dependency) | `.env` files (gitignored — verify with `git status`) |
| `src/` code, `.env.example`, docs, contract updates | `node_modules/`, `dist/` |
| Small demo/seed fixtures used by tests | Real judge credentials, `JWT_SECRET`, Atlas connection strings |

If a secret ever lands in a commit, **rotate it** — deleting the file in a later commit does not remove it from history.

### Suggested ownership

Fill this in as a team and pin it somewhere everyone sees it (module map from §7):

| Area | Owner | Depends on |
| --- | --- | --- |
| Response envelope, error handler, route structure | _TBD_ | — |
| Auth (JWT, bcrypt, role guards) | _TBD_ | foundation |
| Configuration + live status | _TBD_ | auth |
| Admin CRUD (categories, groups, contestants) | _TBD_ | auth |
| Judge scoring | _TBD_ | admin CRUD |
| Reports + calculations + print views | _TBD_ | scoring |
| Frontend shell, router, API layer | _TBD_ | — |
| Mock API + seed script + tests | _TBD_ | — |

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Backend prints nothing for ~30s, then `Database Connection Error: ... ECONNREFUSED` and exits | MongoDB isn't running, or `MONGO_URI` is wrong | Start MongoDB (`docker run -d -p 27017:27017 mongo:7`) or fix the URI. The API can't listen until the DB connects — that's by design in `server.js`. |
| `EADDRINUSE: address already in use :::3000` | Another process (often a previous run) holds the port | Change `PORT` in `backend/.env`, or free it: macOS/Linux `lsof -ti:3000 \| xargs kill` · Windows `netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F` |
| Browser shows **"Blocked request. This host is not allowed."** | Vite's `Host`-header allowlist rejected the domain | Add the host (or its domain suffix) to `server.allowedHosts` in `vite.config.js` — `.e2b.app` is already there |
| `ERR_MODULE_NOT_FOUND: Cannot find module '.../models/User'` | ESM requires file extensions | Write `'../models/User.js'`, not `'../models/User'` |
| Frontend request fails with a CORS error | Backend not running on the expected port, or you bypassed the dev proxy | Run both apps; use the `/api` proxy from §6.3 so requests are same-origin |
| Changes to `backend/.env` have no effect | `dotenv` reads it once at boot and nodemon doesn't watch `.env` | Stop and restart `npm run dev` |
| Tailwind classes have no effect | `main.css` not imported, or a v3-style config was added | Ensure `main.js` imports `./assets/css/main.css`, that it contains `@import "tailwindcss";`, and delete any `tailwind.config.js` |
| `npm ci` / `npm install` fails on Node version | `engines` requires `^22.18.0 \|\| >=24.12.0` | Check `node -v`; install Node 22 LTS or newer |
| `npm test` fails immediately in `backend/` | The script is a placeholder that exits 1 | Expected — no test runner is configured yet. Replace it when you add tests. |
| Vue DevTools doesn't connect | Browser extension missing | See `frontend/README.md` for the Chrome/Firefox extensions |

**Reset to a clean state** (keeps your `.env`):

```bash
# from the repo root
git checkout -- .
cd backend  && rm -rf node_modules && npm ci
cd ../frontend && rm -rf node_modules dist && npm ci
```

---

## 13. Reference links

**In this repo**

- [`API_Contract_v1_0.md`](./API_Contract_v1_0.md) — the API specification (v1.0). Endpoint definitions, request/response examples, error codes, scoring formulas.
- [`frontend/README.md`](./frontend/README.md) — Vue scaffold notes: recommended IDE setup, Vue DevTools installation, Vite config reference.

**External**

- Express 5 — <https://expressjs.com/> (see *Migration guide* if you know Express 4)
- Mongoose — <https://mongoosejs.com/docs/>
- Vue 3 — <https://vuejs.org/guide/introduction.html> · `<script setup>` — <https://vuejs.org/api/sfc-script-setup.html>
- Vue Router 4 — <https://router.vuejs.org/>
- Vite — <https://vite.dev/config/> (server options, proxy, allowedHosts)
- Tailwind CSS v4 — <https://tailwindcss.com/docs/installation/using-vite>
- axios — <https://axios-http.com/docs/intro>
- MongoDB Atlas (free dev cluster) — <https://www.mongodb.com/cloud/atlas>

---

<center>Prepared by <b>@raldincasidar-studio</b> · guide version <b>1.0</b> · verified against commit <code>7ad7f2a</code> on Sept 25, 2026</center>