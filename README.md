# StaffSync — MERN HR Management MVP

A beginner-friendly full-stack starter for an HR management system.

## Features
- JWT login and registration
- Roles: `hr`, `manager`, `employee`
- Employee directory (HR/manager can view all; employees see their own profile)
- Leave requests (employees create; HR/manager approve/reject)
- Attendance check-in/check-out
- Company announcements (HR/manager create)
- React dashboard with simple navigation

## Requirements
- Node.js 18+ (20 LTS recommended)
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- VS Code (recommended)

## 1. Start MongoDB
Install MongoDB Community Server, or create a free MongoDB Atlas cluster.
For local MongoDB, the default connection string is:
`mongodb://127.0.0.1:27017/staffsync`

## 2. Backend
Open a terminal in `backend`:

```bash
npm install
```

Copy `.env.example` to `.env`, then set `MONGO_URI` and a long `JWT_SECRET`.

Start the API:
```bash
npm run dev
```
API runs at `http://localhost:5000`.

## 3. Frontend
Open a second terminal in `frontend`:

```bash
npm install
npm run dev
```
Open the Vite URL printed in the terminal (usually `http://localhost:5173`).

## 4. Create the first HR account
Registration intentionally creates employee accounts only. To make the first HR account:
1. Register an account in the app.
2. In MongoDB, open the `staffsync` database, `users` collection.
3. Change that user's `role` field from `employee` to `hr`.
4. Sign in again.

Do not expose public role selection in production. This setup is for a local learning project.

## 5. Suggested test flow
1. Register two accounts; promote one to `hr` in MongoDB.
2. Log in as HR and create an announcement.
3. Log in as employee and check in.
4. Submit a leave request as employee.
5. Log in as HR and approve/reject the request.

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/employees`
- `GET /api/leaves`
- `POST /api/leaves`
- `PATCH /api/leaves/:id/status`
- `GET /api/attendance`
- `POST /api/attendance/check-in`
- `PATCH /api/attendance/check-out`
- `GET /api/announcements`
- `POST /api/announcements`

## Important
This is an educational MVP, not a production-ready HR platform. Before real use, add input validation, rate limiting, audit logs, password reset, email verification, stronger access policies, tests, backups, and privacy/security review.
