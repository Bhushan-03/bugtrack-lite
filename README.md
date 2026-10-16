# BugTrack Lite — MERN Bug Tracking System

**BugTrack Lite** is a full-stack bug tracking application that helps teams report, manage, and track software bugs in one place. It provides user authentication, team management, bug status tracking, and role-based permissions.

## 🌐 Live Demo

**Website:** https://bugtrack-lite-webapp-46r6.vercel.app/

**GitHub Repository:** https://github.com/Bhushan-03/bugtrack-lite

**Backend API:** https://bugtrack-lite-hyae.onrender.com

**API Health Check:** https://bugtrack-lite-hyae.onrender.com/api/health

## ✨ Features

- **User Authentication:** Register and log in securely using password hashing and JWT authentication.
- **Team Management:** Create teams and join existing teams using invitation codes.
- **Bug Tracking:** Create, view, update, and delete bug reports.
- **Bug Priorities:** Organize issues by Low, Medium, High, and Critical priority.
- **Bug Status Management:** Track bugs through Open, In Progress, Resolved, and Closed statuses.
- **Role-Based Access Control:** Team owners and admins can edit or delete bugs, while team members can create and view bugs.
- **Team Data Isolation:** Restricts access to bugs based on team membership.
- **Protected API Routes:** Authenticate requests and enforce server-side authorization.
- **Input Validation and Rate Limiting:** Apply request validation and limits to selected sensitive endpoints.
- **Responsive User Interface:** Manage bugs and teams through a React-based dashboard.

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB Atlas
- Mongoose

**Authentication and Security**
- JSON Web Tokens (JWT)
- bcryptjs
- CORS
- Express Rate Limit

**Development Tools**
- Git and GitHub
- VS Code / Code0
- OpenAI Codex and ChatGPT for development assistance

## 📁 Project Structure

```text
bugtrack-lite/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthScreen.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── server/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── bug.js
│   │   ├── team.js
│   │   └── user.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bugs.js
│   │   └── teams.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## ⚙️ Run Locally

### Prerequisites

Install the following before starting:

- Node.js and npm
- A MongoDB Atlas account or accessible MongoDB instance
- Git

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

Create a `.env` file inside the `server` directory using `.env.example` as a reference.

Configure the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

Replace the placeholder values with your own configuration. Keep your real `.env` file private and never commit it to GitHub.

### 3. Start the backend

From the `server` directory, run:

```bash
npm run dev
```

The backend should start at `http://localhost:5000` once the database connection succeeds.

Check the API health endpoint:

```text
http://localhost:5000/api/health
```

### 4. Configure the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory with:

```env
VITE_API_URL=http://localhost:5000
```

### 5. Start the frontend

From the `client` directory, run:

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

## 🔐 Roles and Permissions

| Action | Owner | Admin | Member |
|---|---|---|---|
| View bugs in joined teams | Yes | Yes | Yes |
| Create bugs | Yes | Yes | Yes |
| Update bugs | Yes | Yes | No |
| Delete bugs | Yes | Yes | No |

Access is enforced by the backend, not just by hiding buttons in the user interface. Users must belong to the relevant team to access its bugs.

## 🚀 Deployment

BugTrack Lite is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

The frontend uses `VITE_API_URL` to identify the backend API. The backend uses `CLIENT_URL` to configure the permitted frontend origin for CORS.

Production environment variables should be configured in the respective hosting dashboards rather than committed to the repository.

## 🤖 Development Tools and AI Assistance

OpenAI Codex was used within the Code0 development environment to assist with code review and implementation. ChatGPT was also used as a development assistant during implementation and debugging.

### AI-assisted development tasks

- Reviewed frontend and backend code for bugs, security concerns, and deployment issues.
- Corrected frontend API request URLs and request parameter scope issues.
- Implemented role-aware visibility for bug editing and deletion controls.
- Reviewed team-role response privacy, team switching, and server-side authorization.
- Ran production frontend builds to verify successful compilation.

Code changes were reviewed during development. Static code review and successful builds do not replace comprehensive automated testing or independent security testing.

## 🎯 Project Objective

The objective of BugTrack Lite is to demonstrate full-stack web development skills, including building REST APIs, integrating a database, implementing authentication, managing team-based data access, enforcing role-based permissions, and deploying a MERN application.

## 👨‍💻 Author

**Bhushan Jadhav**

GitHub: https://github.com/Bhushan-03

---

If you find this project useful, feel free to explore the repository and try the live demo.
