
## Option A: Run locally (without Docker)
 
### 1. Install dependencies

npm install
 ---
### 2. Set up environment variables

add .env  and add these below variables and replace the values


NODE_ENV=development
PORT=8000
CLIENT_URL=http://localhost:3000
 
MONGO_URI=mongodb+srv://<user>:<password>@<cluster-url>/<db-name>
 
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=another_long_random_string
JWT_REFRESH_EXPIRES_IN=7d
 
# Use REDIS_URL for a managed/cloud Redis (e.g. Upstash), OR use the
# REDIS_HOST/PORT/PASSWORD fields below for a local Redis instance.
# REDIS_URL=rediss://default:<password>@<endpoint>:<port>
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
 
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300


---
 
 
### 3. Run in dev mode (auto-restarts on file changes)

npm run dev

 
### 4. Or build + run production mode

npm run build
npm start

 
Server runs on `http://localhost:8000` 


test :-  http://localhost:8000/api/v1/health

 
---
 
## Option B: Run with Docker
 
This spins up the backend, MongoDB, and Redis together — no local Mongo/Redis install needed.
 
### 1. Set up environment variables

 
### 2. Build and start all services

docker compose up --build
 
This starts three containers:
- `pm-backend` — the API + Socket.IO server, on port `8000`
- `pm-mongo` — local MongoDB, on port `27017`
- `pm-redis` — local Redis, on port `6379`

### 3. Verify it's running

http://localhost:8000/api/v1/health

docker exec pm-backend env | grep REDIS

Should show `REDIS_HOST=redis` (the Docker service name, not `127.0.0.1`).
 
### 4. Stop everything

docker compose down
 
---


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