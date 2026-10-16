# BugTrack Lite

BugTrack Lite is a MERN-stack bug tracking application that helps teams report, organize, and manage software bugs with role-based access control.

## Features

- User registration and login using JWT authentication.
- Password hashing with bcrypt.
- Create and join teams using invitation codes.
- Create and view bugs within a team.
- Track bug priority: Low, Medium, High, and Critical.
- Track bug status: Open, In Progress, Resolved, and Closed.
- Restrict bug updates and deletion to team owners and admins.
- Enforce team-level access control to protect team data.
- Rate limiting for authentication and team invitation attempts.
- Responsive React interface.

## Technology Stack

- Frontend: React, Vite, Tailwind CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JSON Web Tokens (JWT), bcrypt
- Version control: Git and GitHub

## Prerequisites

- Node.js and npm
- A MongoDB database, such as MongoDB Atlas
- Git

## Setup and Run

### 1. Clone the repository

```bash
git clone https://github.com/Bhushan-03/bugtrack-lite.git
cd bugtrack-lite
```

### 2. Configure the backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

Health check: `http://localhost:5000/api/health`

### 3. Configure the frontend

Open a second terminal from the repository root:

```bash
cd client
npm install
```

Create `client/.env` using `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/health` | Check API and database status |
| GET | `/api/teams` | List teams available to the authenticated user |
| POST | `/api/teams` | Create a team |
| POST | `/api/teams/join` | Join a team with an invitation code |
| GET | `/api/bugs` | List bugs for a team |
| POST | `/api/bugs` | Create a bug |
| PATCH | `/api/bugs/:id` | Update a bug, subject to permissions |
| DELETE | `/api/bugs/:id` | Delete a bug, subject to permissions |

Protected endpoints require the JWT access token. Bug endpoints use a `teamId` to scope access to the selected team.

## Security and Permissions

- Passwords are hashed before storage.
- Protected routes require authentication.
- Team membership is checked before granting access to team resources.
- Only team owners and admins can update or delete bugs.
- Authentication and invitation endpoints have rate limits.
- Environment secrets must not be committed to Git.

## Production Configuration

Set `VITE_API_URL` to the deployed backend URL when building the frontend. Set `CLIENT_URL` to the deployed frontend's exact origin on the backend. Configure `MONGODB_URI` and `JWT_SECRET` in the backend hosting provider's environment settings. Never publish real credentials.

## Development Tools and AI Development Experience

OpenAI Codex was used within the Code0 development environment to review and improve BugTrack Lite. ChatGPT was also used as a development assistant during implementation and debugging.

### AI-assisted development tasks

- Reviewed the frontend and backend for bugs, security concerns, and deployment issues.
- Fixed frontend API request URLs and corrected request parameter scope issues.
- Implemented role-aware visibility for bug editing and deletion controls.
- Reviewed team-role response privacy, team switching, and server-side authorization checks.
- Ran production frontend builds after code changes to verify successful compilation.

The changes were reviewed during development. Authorization was checked through static code inspection; live API verification remains a separate testing step.

AI assistance was used to help reason through implementation, debugging, and security checks. Review and test generated changes before relying on them.

## Author

Bhushan Jadhav
