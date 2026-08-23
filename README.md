# 🏢 Society Maintenance Tracker

A modern, full-stack web platform built for apartment societies and residential communities. Residents can raise and monitor maintenance complaints with photos and chronological timeline audits, while society administrators triage tickets with priorities, track overdue SLAs, post pinned notices, and broadcast automated email alerts.

---

## 🌟 Key Features

- **Role-Based Access Control (RBAC)**:
  - **Resident**: Register, log in, file maintenance requests with category/photo, view ticket timeline history, and read notice board.
  - **Admin**: Dashboard metrics, filter/search complaints, update priority (`LOW`, `MEDIUM`, `HIGH`), advance status lifecycle (`OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`), configure overdue thresholds, and post pinned announcements.
- **Complaint Lifecycle & Audit History**: Every status transition logs the actor, timestamp, previous status, new status, and optional admin resolution notes.
- **Configurable Overdue SLA Detection**: Dynamic calculation of overdue tickets based on admin-configured threshold days (surfaced at the top of the triage queue).
- **Notice Board with Pinning**: Important notices are pinned to the top and automatically broadcasted to resident emails.
- **Pluggable Notification Engine**: Outbound HTML email dispatch with fallback to an interactive **In-App Notification Inspector** modal for instant verification without 3rd-party credentials.
- **Admin Analytics Dashboard**: Real-time KPI summaries and interactive charts for complaint distribution across categories and statuses.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Axios, React Router.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Multer, Nodemailer, Bcrypt, JWT, Vitest.
- **Database**: SQLite (zero-config local start; seamless transition to PostgreSQL / MySQL via Prisma).

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or install inside `backend/` and `frontend/` individually).*

### 2. Setup Database & Seed Data
```bash
npm run seed
```
This runs Prisma migrations, creates the database schema, and seeds default admin, resident accounts, notices, and sample complaints with full lifecycles.

### 3. Run Development Servers
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Pre-Seeded Test Accounts

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@society.com` | `Admin@123` | Society Manager with full administrative triage & config access |
| **Resident** | `resident@society.com` | `Resident@123` | Resident (Flat B-402) with active complaints |
| **Resident 2** | `david.miller@society.com` | `Resident@123` | Resident (Flat A-104) with resolved elevator complaint |

*(The login screen also includes 1-click quick autofill buttons for evaluation).*

---

## ⚙️ Environment Configuration (`.env.example`)

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=society_maintenance_super_secret_jwt_key_2026_!@#
JWT_EXPIRES_IN=7d

# Overdue SLA Configuration (in days)
DEFAULT_OVERDUE_DAYS=3

# SMTP Email Configuration (Optional - logs to In-App Inspector if empty)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Society Office <notifications@societyhub.local>"

# Uploads
UPLOAD_DIR=uploads
CLIENT_URL=http://localhost:5173
```

---

## 📚 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new user (`name`, `email`, `password`, `flatNumber`, `phone`, optional `role`).
- `POST /api/auth/login`: Authenticate and obtain JWT token.
- `GET /api/auth/me`: Fetch authenticated user profile.

### Complaints (`/api/complaints`)
- `POST /api/complaints`: [Resident/Admin] Create complaint with `title`, `category`, `description`, and optional multipart `photo`.
- `GET /api/complaints/my`: [Resident] Get personal complaints with full history.
- `GET /api/complaints`: [Admin] Get all complaints with filters (`status`, `category`, `priority`, `search`, `overdueOnly`, `startDate`, `endDate`).
- `GET /api/complaints/:id`: Get single complaint with timeline history.
- `PATCH /api/complaints/:id/status`: [Admin] Update status (`OPEN`, `IN_PROGRESS`, `RESOLVED`) with note; triggers email notification.
- `PATCH /api/complaints/:id/priority`: [Admin] Update priority (`LOW`, `MEDIUM`, `HIGH`).

### Notices (`/api/notices`)
- `GET /api/notices`: List all notices (pinned notices ordered first).
- `POST /api/notices`: [Admin] Post notice (`title`, `content`, `isImportant`). Broadcasts email if `isImportant: true`.
- `PUT /api/notices/:id`: [Admin] Edit notice.
- `DELETE /api/notices/:id`: [Admin] Remove notice.

### Dashboard & Analytics (`/api/dashboard`)
- `GET /api/dashboard/stats`: [Admin] Get summary metrics, overdue counts, category distribution, and live activity feed.

### Configuration & Logs (`/api/config`)
- `GET /api/config`: Get society configuration & overdue threshold.
- `PUT /api/config`: [Admin] Update society name, overdue threshold days, or contact information.
- `GET /api/config/logs/notifications`: [Admin/Dev] View dispatched email notification logs and rendered HTML content.

---

## 🗄️ Database Schema

```
┌──────────────────┐       1:N       ┌────────────────────────┐
│      User        ├────────────────►│       Complaint        │
│ ──────────────── │                 │ ────────────────────── │
│ id (PK)          │                 │ id (PK)                │
│ name             │                 │ ticketId (Unique)      │
│ email (Unique)   │                 │ title, category        │
│ passwordHash     │                 │ description, photoUrl  │
│ role (RES/ADMIN) │                 │ status, priority       │
│ flatNumber       │                 │ residentId (FK)        │
│ phone            │                 │ resolvedAt, createdAt  │
└────────┬─────────┘                 └───────────┬────────────┘
         │                                       │
         │ 1:N                                   │ 1:N
         ▼                                       ▼
┌──────────────────┐                 ┌────────────────────────┐
│      Notice      │                 │    ComplaintHistory    │
│ ──────────────── │                 │ ────────────────────── │
│ id (PK)          │                 │ id (PK)                │
│ title, content   │                 │ complaintId (FK)       │
│ isImportant(Pin) │                 │ previousStatus         │
│ authorId (FK)    │                 │ newStatus              │
│ createdAt        │                 │ changedById (FK)       │
└──────────────────┘                 │ note, timestamp        │
                                     └────────────────────────┘
```

---

## 🧪 Automated Testing

Run the test suite with Vitest and Supertest:
```bash
npm test
```
Tests cover:
- Authentication & JWT issuance
- Complaint ticket auto-numbering (`CMP-XXXX`)
- Atomic status history transitions & note logging
- Overdue computation logic
- Notice board priority sorting

---

## 📦 Deliverables & Packaging

To generate a clean submission ZIP archive:
```bash
npm run zip
```
Produces `society-maintenance-tracker.zip` ready for distribution.
