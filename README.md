# GBU Exam Management System

A full-stack web application for Gautam Buddha University to manage the complete examination lifecycle — from scheduling and seating allocation to invigilation assignment, attendance recording, and analytics reporting.

---

## Features

- **Admin Authentication** — Secure JWT-based login with Google OAuth support
- **Student Management** — Add, edit, delete, and bulk import student records
- **Faculty Management** — Manage faculty profiles with availability tracking and duty count
- **Room Management** — Configure examination halls with capacity and seating layout
- **Exam Scheduling** — Schedule exams with subject, date, shift, branches, and semester
- **Seating Allocation** — Auto-generate interleaved seating plans to prevent copying
- **Invigilation Assignment** — Auto-assign chief and assistant invigilators per room with load balancing
- **Attendance Management** — Digital attendance sheets with real-time marking
- **Summary & Reports** — Printable seating plans, attendance summaries, and analytics dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | PHP 8.1+, Apache |
| Database | MySQL / MariaDB |
| Auth | JWT (JSON Web Tokens) |
| Dev Environment | XAMPP |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [XAMPP](https://www.apachefriends.org/) (Apache + MySQL + PHP)

### 1. Database Setup

Start XAMPP and run the schema file to create the database:

```bash
mysql -u root -p < backend/database/schema.sql
```

Or import `backend/database/schema.sql` via phpMyAdmin.

Default admin credentials:
- **Email:** `admin1234@gbu.ac.in`
- **Password:** `admin1234`

### 2. Backend Setup

Place the project folder inside `C:\xampp\htdocs\` so the backend is accessible at:
```
http://localhost/exam-manager/backend
```

Configure your database connection in `.env.backend`:
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=exam_manager
DB_USER=root
DB_PASS=
JWT_SECRET=your-secret-key
```

### 3. Frontend Setup

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Production Build

```bash
npm run build
```

Output will be in the `dist/` folder.

---

## Project Structure

```
exam-manager/
├── backend/
│   ├── config/          # Database and CORS configuration
│   ├── controllers/     # API controllers (Auth, Student, Faculty, Room, Exam, Seating, etc.)
│   ├── database/        # SQL schema
│   ├── helpers/         # JWT, response, rate limiting helpers
│   ├── middleware/       # Auth middleware
│   ├── index.php        # Entry point
│   └── router.php       # API router
├── src/
│   ├── app/
│   │   ├── components/  # React components (Dashboard, Seating, Attendance, etc.)
│   │   ├── lib/         # API client, store, utilities
│   │   └── routes.jsx   # Application routes
│   └── styles/          # CSS and Tailwind styles
├── .env.backend         # Backend environment config
└── backend/database/schema.sql  # Database schema
```

---

## Database

The system uses a MySQL database named `exam_manager` with 8 tables:

| Table | Description |
|---|---|
| `admin_login` | User authentication and roles |
| `students` | Student academic records |
| `faculty` | Faculty profiles and availability |
| `rooms` | Examination hall configuration |
| `exams` | Exam schedules |
| `seating_allocations` | Student seat assignments |
| `invigilation_allocations` | Faculty room assignments |
| `attendance_records` | Student attendance per exam |

---

## Done By

**Ankit Sharma** — 235UCS024  
**Ansh Gusain** — 235UCS026

Gautam Buddha University  
School of Information and Communication Technology  
Department of Computer Science & Engineering
