# GBU Exam Management System — Data Flow Diagram

## Level 0 — Context Diagram

```
                        ┌─────────────────────────────────┐
                        │                                 │
   Admin ──────────────►│   GBU Exam Management System    │──────────────► Reports / PDFs
   (credentials,        │                                 │                (Seating Plans,
    exam data,          │   exam-manager (React + PHP)    │                 Attendance Sheets,
    attendance marks)   │                                 │                 Summary Reports)
                        └─────────────────────────────────┘
```

---

## Level 1 — Main Processes

```
                                    ┌──────────────────────────────────────────────────────────────────┐
                                    │                    GBU Exam Management System                     │
                                    │                                                                    │
  Admin ──── [Login] ──────────────►│  P1: Authentication ──── JWT Token ────────────────────────────► │
                                    │         │                                                          │
                                    │         ▼                                                          │
                                    │  ┌─────────────────────────────────────────────────────────────┐  │
                                    │  │                    Protected Admin Portal                    │  │
                                    │  │                                                              │  │
  Admin ── [Student Data] ─────────►│  │  P2: Student Management ──────────────────► D1: students   │  │
  Admin ── [Faculty Data] ─────────►│  │  P3: Faculty Management ──────────────────► D2: faculty    │  │
  Admin ── [Room Config] ──────────►│  │  P4: Room Management ─────────────────────► D3: rooms      │  │
  Admin ── [Exam Details] ─────────►│  │  P5: Exam Scheduling ─────────────────────► D4: exams      │  │
                                    │  │                                                              │  │
                                    │  │  P6: Seating Allocation ◄── D1+D3+D4 ──────► D5: seating   │  │
                                    │  │  P7: Invigilation Mgmt  ◄── D2+D3+D4 ──────► D6: invig.    │  │
                                    │  │  P8: Attendance Mgmt    ◄── D1+D5+D6 ──────► D7: attend.   │  │
                                    │  │                                                              │  │
                                    │  │  P9: Summary            ◄── D4+D5+D7                        │  │
                                    │  │  P10: Reports           ◄── D1+D2+D3+D4+D5+D6+D7           │  │
                                    │  └─────────────────────────────────────────────────────────────┘  │
                                    └──────────────────────────────────────────────────────────────────┘
```

---

## Level 2 — Detailed Data Flows

### P2: Student Management
```
Admin ──[roll_number, name, school, dept, branch,
          semester, year, session, batch, type]──► StudentController.store()
                                                         │
                                                         ▼
                                                   D1: students
                                                   ┌──────────────────┐
                                                   │ id               │
                                                   │ roll_number (PK) │
                                                   │ name             │
                                                   │ school           │
                                                   │ department       │
                                                   │ branch           │
                                                   │ semester         │
                                                   │ year             │
                                                   │ session          │
                                                   │ batch            │
                                                   │ type             │
                                                   └──────────────────┘
                                                         │
                                                         ▼
                                              StudentManagement.jsx (display)
```

### P3: Faculty Management
```
Admin ──[phone, name, school, dept, designation,
          email, status, leave_reason]──────────► FacultyController.store()
                                                         │
                                                         ▼
                                                   D2: faculty
                                                   ┌──────────────────┐
                                                   │ id               │
                                                   │ phone (UQ)       │
                                                   │ name             │
                                                   │ school           │
                                                   │ department       │
                                                   │ designation      │
                                                   │ status           │
                                                   │ leave_reason     │
                                                   │ total_duties     │
                                                   │ is_available     │
                                                   └──────────────────┘
```

### P4: Room Management
```
Admin ──[room_number, building, floor,
          rows_count, cols_count]───────────────► RoomController.store()
                                                         │
                                                         ▼
                                                   D3: rooms
                                                   ┌──────────────────┐
                                                   │ id               │
                                                   │ room_number      │
                                                   │ building         │
                                                   │ floor            │
                                                   │ capacity         │  ← rows × cols
                                                   │ rows_count       │
                                                   │ cols_count       │
                                                   │ is_available     │
                                                   └──────────────────┘
                                                         │
                              Layout change ─────────────┤
                                                         ▼
                                              Auto re-allocate all
                                              affected date+shifts
```

### P5: Exam Scheduling
```
Admin ──[name, course_code, subject, date, shift,
          start_time, end_time, branches[],
          semester, batch, status]──────────────► ExamController.store()
                                                         │
                                                         ▼
                                                   D4: exams
                                                   ┌──────────────────┐
                                                   │ id               │
                                                   │ course_code      │
                                                   │ subject          │
                                                   │ date             │
                                                   │ shift            │
                                                   │ start_time       │
                                                   │ end_time         │
                                                   │ branches (JSON)  │
                                                   │ semester         │
                                                   │ batch            │
                                                   │ status           │
                                                   └──────────────────┘
```

### P6: Seating Allocation
```
Admin ──[date, shift]──► SeatingController.allocateByDate()
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
        D4: exams            D1: students             D3: rooms
     (filter by              (filter by               (is_available=1,
      date+shift)             branch+semester          ordered by
                              +batch)                  room_number)
              │                     │                      │
              └─────────────────────┼──────────────────────┘
                                    │
                                    ▼
                         Pairing Algorithm
                    ┌───────────────────────────┐
                    │ • Group exams by shift     │
                    │ • Pair exams with diff     │
                    │   course_code + subject    │
                    │ • Assign branches to rooms │
                    │ • Even cols → Exam A       │
                    │ • Odd  cols → Exam B       │
                    │ • Adjacent seats differ    │
                    └───────────────────────────┘
                                    │
                                    ▼
                              D5: seating_allocations
                              ┌──────────────────┐
                              │ id               │
                              │ exam_id  (FK)    │
                              │ room_id  (FK)    │
                              │ student_id (FK)  │
                              │ seat_number      │
                              └──────────────────┘
                                    │
                                    ▼
                         Auto-assign Invigilation
                         (2 faculty per room per shift)
                                    │
                                    ▼
                              D6: invigilation_allocations
```

### P7: Invigilation Management
```
SeatingController ──[auto]──► InvigilationController (embedded in allocateByDate)
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
        D5: seating          D2: faculty              D4: exams
     (rooms used             (is_available=1,
      this shift)             sorted by
                              total_duties ASC)
              │                     │                      │
              └─────────────────────┼──────────────────────┘
                                    │
                                    ▼
                         Assignment Rules
                    ┌───────────────────────────┐
                    │ • Exactly 2 per room       │
                    │ • 1 chief + 1 assistant    │
                    │ • No double-booking        │
                    │   within same shift        │
                    │ • Load-balanced by         │
                    │   total_duties             │
                    └───────────────────────────┘
                                    │
                                    ▼
                              D6: invigilation_allocations
                              ┌──────────────────┐
                              │ id               │
                              │ exam_id  (FK)    │
                              │ room_id  (FK)    │
                              │ faculty_id (FK)  │
                              │ role (chief/asst)│
                              └──────────────────┘
                                    │
                                    ▼
                         faculty.total_duties += 1

Admin ──[edit room]──► updateRoom() ──► D6 updated
                                    │
                                    ▼
                         faculty.total_duties adjusted
```

### P8: Attendance Management
```
Admin ──[date, shift, room]──► AttendanceController.generate()
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
        D4: exams            D5: seating              D6: invig.
     (exams in room)         (students in room)       (faculty in room)
              │                     │
              └─────────────────────┘
                                    │
                                    ▼
                              D7: attendance_records
                              ┌──────────────────┐
                              │ id               │
                              │ exam_id  (FK)    │
                              │ room_id  (FK)    │
                              │ student_id (FK)  │
                              │ status           │  ← not-marked / present / absent
                              │ signature        │
                              └──────────────────┘
                                    │
Admin ──[P / A toggle]──────────────┤
Admin ──[Mark All Present]──────────┤
                                    ▼
                         D7 updated (optimistic UI)
```

### P9: Summary
```
Admin ──[date, shift]──► Summary.jsx (frontend only, no API call)
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
        D4: exams            D1: students          D7: attendance
     (filter by              (filter by             (count present/
      date+shift)             branch+semester        absent per
                              +batch)                student)
              │                     │                      │
              └─────────────────────┼──────────────────────┘
                                    │
                                    ▼
                         Summary Table
                    ┌───────────────────────────┐
                    │ Branch | Sem | Year        │
                    │ Course Code | Course Name  │
                    │ Present | Absent | Total   │
                    │ Absent Roll Numbers        │
                    └───────────────────────────┘
                                    │
Admin ──[Print]─────────────────────┘
                                    ▼
                         PDF (window.print())
```

### P10: Reports & Analytics
```
Store (in-memory) ──► Reports.jsx (frontend only)
        │
        ├── D1: students      ──► Students by Branch (Pie)
        │                         Students by School (Bar)
        │
        ├── D3: rooms         ──► Room Utilization (Bar + Table)
        │   + D5: seating          filtered by date + shift
        │
        ├── D2: faculty       ──► Faculty Duties (Table)
        │   + D6: invig.           filtered by date
        │
        ├── D4: exams         ──► Attendance by Exam (Bar + Table)
        │   + D7: attendance        filtered by date + shift
        │
        └── D6: invig.        ──► Invigilation by Department (Pie)
```

---

## Data Store Summary

| ID | Table | Primary Key | Key Foreign Keys |
|---|---|---|---|
| D1 | `students` | `id` | — |
| D2 | `faculty` | `id` | — |
| D3 | `rooms` | `id` | — |
| D4 | `exams` | `id` | — |
| D5 | `seating_allocations` | `id` | exam_id, room_id, student_id |
| D6 | `invigilation_allocations` | `id` | exam_id, room_id, faculty_id |
| D7 | `attendance_records` | `id` | exam_id, room_id, student_id |
| D8 | `admin_login` | `id` | — |

---

## Request / Response Flow (HTTP)

```
Browser (React)
      │
      │  fetch() with JWT Bearer token
      │
      ▼
Apache (localhost/exam-manager/backend)
      │
      ▼
index.php
      │
      ▼
cors.php ──► Set CORS headers
      │
      ▼
Router.dispatch()
      │
      ├── Match route pattern (regex)
      │
      ├── AuthMiddleware.authenticate()
      │         │
      │         ▼
      │    JwtHelper.verify(token)
      │         │
      │         ▼
      │    PDO → users table
      │
      ▼
Controller::method($params)
      │
      ├── getBody()   ← php://input JSON
      ├── getQuery()  ← $_GET params
      │
      ▼
PDO prepared statement → MySQL (port 3307)
      │
      ▼
toCamel($result)  ← snake_case → camelCase
      │
      ▼
jsonResponse($data, $statusCode)
      │
      ▼
Browser receives JSON
      │
      ▼
store.normalize()  ← stringify IDs, cast types
      │
      ▼
React state → Component re-render
```
