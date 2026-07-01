# Internal Project Management System — Backend

Real-time task/project collaboration API. Node.js + Express + MongoDB + Socket.IO + Redis.

## 1. Architecture Overview

**Layers**
- `controllers/` — parse request, call a service, shape the HTTP response, emit socket events. No business logic here.
- `services/` — all business logic, DB queries, authorization checks. Reusable from controllers or sockets.
- `models/` — Mongoose schemas.
- `sockets/` — Socket.IO auth, room management, broadcast helpers.
- `middleware/` — auth guard, Joi validation, centralized error handler.
- `validations/` — Joi schemas per resource.
- `config/` — env, DB, Redis connections.

## 2. Real-Time Communication Strategy

- **Transport:** Socket.IO (WebSocket with automatic fallback).
- **Auth:** the socket handshake carries the JWT access token (`socket.handshake.auth.token`). A Socket.IO middleware (`sockets/socketAuth.js`) verifies it before `connection` fires — unauthenticated sockets are rejected outright.
- **Rooms:** each project gets a room `project:<projectId>`. A client calls `project:join` after connecting; the server re-verifies project membership server-side before allowing the join (never trusts client-supplied membership claims).
- **Flow for "User A moves a task":**
  1. Client A calls `PATCH /api/v1/tasks/:id/status` (REST, not socket — REST is the single source of truth for mutations, which keeps validation, auth checks, and DB writes in one consistent code path).
  2. Controller updates MongoDB via the task service.
  3. Controller calls `emitToProject(projectId, 'task:statusChanged', payload)`.
  4. Everyone in that project's room (User B) receives the event instantly.
  5. User C, who opens the project later, calls `GET /api/v1/projects/:id/tasks` and gets the current DB state — no replay/event-sourcing needed since Mongo is always the source of truth.
- **Why REST-mutate + socket-broadcast (instead of socket-only mutation):** keeps a single validation/authorization path, works even if a client's socket briefly drops, and makes the API testable/scriptable without a socket client.
- **Horizontal scaling:** `@socket.io/redis-adapter` is attached in `sockets/index.js`. If the backend is ever scaled to N instances behind Nginx, a broadcast from instance A still reaches sockets connected to instance B via Redis pub/sub. Without this, multi-instance deployments would silently drop real-time updates for some users.
- **Redis is also used for:** short-TTL (60s) caching of single-project reads to cut DB load on a page that's opened/refreshed often, invalidated on every write to that project.

### Socket Events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `project:join` | client → server | `projectId` (ack callback) | Join a project's real-time room (membership re-verified server-side) |
| `project:leave` | client → server | `projectId` (ack callback) | Leave a project's room |
| `presence:userJoined` | server → room | `{ userId, name }` | Someone entered the project view |
| `presence:userLeft` | server → room | `{ userId, name }` | Someone left the project view |
| `task:created` | server → room | `{ task }` | New task added |
| `task:updated` | server → room | `{ task }` | Task fields edited |
| `task:statusChanged` | server → room | `{ taskId, status, order, updatedBy, task }` | Task moved between columns (the core "Todo → In Progress" event) |
| `task:deleted` | server → room | `{ taskId }` | Task removed |
| `project:updated` | server → room | `{ project }` | Project details edited |
| `project:deleted` | server → room | `{ projectId }` | Project removed |
| `project:memberAdded` | server → room | `{ projectId, members }` | New member added |

## 3. Database Schema

**User**
```
{ name, email (unique), password (hashed, select:false), role: admin|manager|member, timestamps }
```

**Project**
```
{
  name, description,
  owner: ObjectId -> User,
  members: [{ user: ObjectId -> User, role: manager|member }],
  status: active|archived,
  timestamps
}
```

**Task**
```
{
  title, description,
  project: ObjectId -> Project,
  status: todo|in-progress|done,
  assignee: ObjectId -> User | null,
  createdBy: ObjectId -> User,
  priority: low|medium|high,
  order: Number,        // manual ordering within a status column
  dueDate: Date | null,
  timestamps
}
```

Indexes: `Project{owner,status}`, `Project{members.user}`, `Task{project,status,order}` — matches the two hottest queries (list my projects, list a board's tasks by column).

## 4. Why This Approach

- **Service layer separated from controllers** so business rules (e.g. "only the owner can delete a project") live in one testable place, not scattered across route handlers.
- **REST for mutation, sockets for broadcast** — see real-time section above.
- **Joi validation middleware** applied per-route via a small reusable `validate(schema)` factory, rather than validating inline in controllers.
- **Centralized error middleware** normalizes Mongoose errors (`ValidationError`, `CastError`, duplicate key `11000`) and custom `ApiError`s into one consistent JSON error shape — controllers just `throw` and never touch `res.status(...).json(...)` for errors.
- **Redis adapter for Socket.IO** — required the moment this app runs on more than one instance/process behind Nginx (e.g. `pm2 -i max` or multiple VMs), which is likely for anything beyond a demo.

## 5. Scalability Considerations

- Stateless Node process (JWT, no server-side sessions) → safe to run multiple instances behind Nginx/PM2 cluster mode.
- Redis adapter makes Socket.IO broadcasts correct across instances.
- Redis cache reduces read load on hot project pages.
- MongoDB indexes on the exact query patterns used.
- Rate limiting (`express-rate-limit`) on `/api/*` to protect against abuse.
- `compression` + `helmet` for basic production hygiene.
- Clear path to add a message queue (e.g. BullMQ on the same Redis) if async work (emails, notifications) is added later.


# API List

Base URL

/api/v1

---

## Authentication APIs

### POST /auth/register
- Purpose: Register a new user.
### POST /auth/login
- Purpose: Authenticate the user and return access and refresh tokens.
### POST /auth/refresh
- Purpose: Generate a new access token using a refresh token.
### GET /auth/me
- Purpose: Retrieve the currently logged-in user's profile.

---

## Project APIs

### POST /projects
- Purpose: Create a new project.
### GET /projects
- Purpose: Retrieve all projects owned by or assigned to the authenticated user.
### GET /projects/:projectId
- Purpose: Retrieve details of a specific project.
### PATCH /projects/:projectId
- Purpose: Update project information.
### DELETE /projects/:projectId
- Purpose: Delete an existing project.
### POST /projects/:projectId/members
- Purpose: Add a new member to a project.

---

## Task APIs

### GET /projects/:projectId/tasks
- Purpose: Retrieve all tasks belonging to a project.
### POST /projects/:projectId/tasks
- Purpose: Create a new task within a project.
### GET /tasks/:taskId
- Purpose: Retrieve details of a specific task.
### PATCH /tasks/:taskId
- Purpose: Update task information such as title, assignee, priority, or due date.
### PATCH /tasks/:taskId/status
- Purpose: Change a task's status and position on the project board. This endpoint also triggers real-time updates for other project members.
### DELETE /tasks/:taskId
- Purpose: Delete a task.

---

## Utility API

### GET /health
- Purpose: Check whether the backend service is running.


## 7. Local Setup

**Prerequisites:** Node 18+, MongoDB running locally (or Atlas URI), Redis running locally.

```bash
git clone <repo-url>
cd backend
cp .env.example .env      # then fill in real secrets
npm install
npm run seed               # optional: creates demo users/project/tasks
npm run dev                 # nodemon, http://localhost:5000
```

Demo credentials after `npm run seed`:
- `alice@example.com` / `password123` (owner)
- `bob@example.com` / `password123` (member)

**Socket.IO client connection example:**
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: accessToken },
});

socket.emit('project:join', projectId, (ack) => console.log(ack));
socket.on('task:statusChanged', (payload) => { /* update board */ });
```

## 8. Deployment (VM + Nginx + Let's Encrypt)

1. **Provision a VM** (DigitalOcean/Hetzner/Vultr), install Node 18, MongoDB (or use Atlas), Redis, Nginx, PM2.
2. **Clone & configure**
   ```bash
   git clone <repo-url> /var/www/pm-tool-backend
   cd /var/www/pm-tool-backend
   npm ci --omit=dev
   cp .env.example .env   # fill production values
   ```
3. **Run with PM2**
   ```bash
   pm2 start server.js --name pm-tool-backend
   pm2 save
   pm2 startup
   ```
4. **Nginx reverse proxy** (`/etc/nginx/sites-available/pm-tool-api`):
   ```nginx
   server {
     listen 80;
     server_name api.yourdomain.com;

     location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";   # required for Socket.IO
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/pm-tool-api /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
5. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```
6. **Secure MongoDB**: bind to `127.0.0.1` only (or use Atlas with IP allowlist), enable auth, keep `MONGO_URI` in `.env` (never committed — see `.gitignore`).
7. **CI/CD**: `.github/workflows/ci.yml` runs lint + a module-load smoke check on every push/PR, then on push to `main` SSHes into the VM, pulls, reinstalls, and restarts via PM2. Requires repo secrets: `VM_HOST`, `VM_USER`, `VM_SSH_KEY`.

**Branching strategy:** feature branches → PR into `develop` (CI runs lint/build only) → `develop` → `main` for release (CI additionally deploys to the VM).

## 9. AI Usage Declaration

This backend was scaffolded with AI assistance (Claude). Every file follows a deliberate, explainable structure (service-layer separation, centralized error handling, Redis-backed Socket.IO scaling) that I can walk through line-by-line, including the reasoning behind each design choice, per the assessment's requirement.

## 10. URLs (fill in after deploying)

- Backend URL: `https://api.yourdomain.com`
- Frontend URL: _TBD (Phase 3)_
- GitHub repo: _TBD_
