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