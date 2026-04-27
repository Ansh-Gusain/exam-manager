# Exam Manager - PHP Backend

## Requirements
- PHP 8.1+
- MySQL 8.0+
- Apache with `mod_rewrite` enabled (or Nginx)

## Setup

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Configuration
Edit `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'exam_manager');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');
define('JWT_SECRET', 'change-this-to-a-long-random-string');
```

### 3. Web Server
Point your document root to the `backend/` folder, or place it at a path like `/api`.

**Apache** — `.htaccess` is already included.

**Nginx** example:
```nginx
location /api {
    try_files $uri $uri/ /api/index.php?$query_string;
}
```

### 4. Default Admin Login
- Email: `admin@gbu.ac.in`
- Password: `admin123`

Change the password after first login.

---

## API Reference

All endpoints (except login) require:
```
Authorization: Bearer <jwt_token>
```

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Current user info |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/students` | List (filters: school, department, branch, semester, year, section, session) |
| POST   | `/api/students` | Create |
| GET    | `/api/students/{id}` | Get one |
| PUT    | `/api/students/{id}` | Update |
| DELETE | `/api/students/{id}` | Delete |
| POST   | `/api/students/bulk` | Bulk import `{ "students": [...] }` |

### Faculty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/faculty` | List (filters: school, department, branch, designation, isAvailable) |
| POST   | `/api/faculty` | Create |
| GET    | `/api/faculty/{id}` | Get one |
| PUT    | `/api/faculty/{id}` | Update |
| DELETE | `/api/faculty/{id}` | Delete |
| POST   | `/api/faculty/bulk` | Bulk import |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/rooms` | List (filters: building, isAvailable, hasProjector) |
| POST   | `/api/rooms` | Create |
| PUT    | `/api/rooms/{id}` | Update |
| DELETE | `/api/rooms/{id}` | Delete |

### Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/exams` | List (filters: status, semester) |
| POST   | `/api/exams` | Create |
| PUT    | `/api/exams/{id}` | Update / change status |
| DELETE | `/api/exams/{id}` | Delete |

### Seating Allocation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/seating` | List (filters: examId, roomId) |
| POST   | `/api/seating/allocate` | Auto-allocate `{ "examId": 1 }` |
| DELETE | `/api/seating/exam/{examId}` | Clear allocations |

### Invigilation Allocation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/invigilation` | List (filters: examId, facultyId) |
| POST   | `/api/invigilation/allocate` | Auto-assign `{ "examId": 1 }` |
| DELETE | `/api/invigilation/exam/{examId}` | Clear allocations |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/attendance` | List (filters: examId, roomId, studentId, status) |
| POST   | `/api/attendance/generate` | Generate sheet `{ "examId": 1, "roomId": 2 }` |
| PUT    | `/api/attendance/{id}` | Mark `{ "status": "present", "signature": true }` |
| POST   | `/api/attendance/mark-all-present` | Bulk mark `{ "examId": 1, "roomId": 2 }` |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/room-utilization` | Room usage stats |
| GET | `/api/reports/faculty-duties` | Faculty duty distribution |
| GET | `/api/reports/attendance` | Attendance summary per exam |
| GET | `/api/reports/distribution` | Student/faculty distribution |

### Academic Structure
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/academic/schools` | All schools |
| GET | `/api/academic/departments?school=SOICT` | Departments (optionally filtered) |
| GET | `/api/academic/branches?department=CSE` | Branches (optionally filtered) |
| GET | `/api/academic/structure` | Full hierarchy |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats, upcoming exams |

---

## Connecting the React Frontend

Update your React store/API calls to point to this backend. Example:

```js
const API_BASE = 'http://localhost/backend/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
}
```
