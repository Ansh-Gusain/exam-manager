-- Exam Manager Database Schema
-- Run: mysql -u root -p < backend/database/schema.sql

CREATE DATABASE IF NOT EXISTS exam_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exam_manager;

-- Admin Login (auth)
CREATE TABLE IF NOT EXISTS admin_login (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100) UNIQUE NOT NULL,
    email      VARCHAR(150) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(150) NOT NULL,
    role       ENUM('admin','faculty','student') NOT NULL DEFAULT 'student',
    ref_id     INT NULL COMMENT 'faculty.id or students.id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE IF NOT EXISTS students (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(150) NOT NULL,
    school      VARCHAR(20) NOT NULL,
    department  VARCHAR(50) NOT NULL,
    branch      VARCHAR(50) NOT NULL,
    semester    TINYINT NOT NULL,
    year        VARCHAR(10) NOT NULL,
    session     VARCHAR(20) NOT NULL,
    batch       VARCHAR(20) NOT NULL,
    type        ENUM('regular','repeater') NOT NULL DEFAULT 'regular',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_branch (branch),
    INDEX idx_semester (semester),
    INDEX idx_school (school),
    INDEX idx_batch (batch),
    INDEX idx_semester_batch (semester, batch),
    INDEX idx_branch_semester (branch, semester)
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    school       VARCHAR(20) NOT NULL,
    department   VARCHAR(50) NOT NULL,
    designation  VARCHAR(50) NOT NULL,
    email        VARCHAR(150) NULL,
    status       ENUM('available','on_leave','not_available') NOT NULL DEFAULT 'available',
    leave_reason TEXT NULL,
    phone        VARCHAR(10) NOT NULL,
    total_duties INT NOT NULL DEFAULT 0,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_phone (phone),
    INDEX idx_school (school),
    INDEX idx_department (department),
    INDEX idx_available (is_available)
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    room_number   VARCHAR(20) NOT NULL,
    building      VARCHAR(100) NOT NULL,
    floor         TINYINT NOT NULL DEFAULT 0,
    capacity      INT NOT NULL,
    has_projector TINYINT(1) NOT NULL DEFAULT 0,
    is_available  TINYINT(1) NOT NULL DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_room (room_number, building),
    INDEX idx_available (is_available)
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    subject    VARCHAR(200) NOT NULL,
    date       DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    branches   JSON NOT NULL COMMENT 'Array of branch codes',
    semester   TINYINT NOT NULL,
    batch      VARCHAR(20) NULL COMMENT 'e.g. 2023-2027',
    status     ENUM('scheduled','ongoing','completed') NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_date (date)
);

-- Seating Allocations
CREATE TABLE IF NOT EXISTS seating_allocations (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    exam_id     INT NOT NULL,
    room_id     INT NOT NULL,
    student_id  INT NOT NULL,
    seat_number INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_seat (exam_id, room_id, seat_number),
    UNIQUE KEY uq_student_exam (exam_id, student_id),
    FOREIGN KEY (exam_id)    REFERENCES exams(id)    ON DELETE CASCADE,
    FOREIGN KEY (room_id)    REFERENCES rooms(id)    ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_exam (exam_id),
    INDEX idx_room (room_id)
);

-- Invigilation Allocations
CREATE TABLE IF NOT EXISTS invigilation_allocations (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    exam_id    INT NOT NULL,
    room_id    INT NOT NULL,
    faculty_id INT NOT NULL,
    role       ENUM('chief','assistant') NOT NULL DEFAULT 'assistant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_invigilation (room_id, role, exam_id),
    FOREIGN KEY (exam_id)    REFERENCES exams(id)   ON DELETE CASCADE,
    FOREIGN KEY (room_id)    REFERENCES rooms(id)   ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
    INDEX idx_exam (exam_id),
    INDEX idx_faculty (faculty_id)
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    exam_id    INT NOT NULL,
    room_id    INT NOT NULL,
    student_id INT NOT NULL,
    status     ENUM('present','absent','not-marked') NOT NULL DEFAULT 'not-marked',
    signature  TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance (exam_id, student_id),
    FOREIGN KEY (exam_id)    REFERENCES exams(id)    ON DELETE CASCADE,
    FOREIGN KEY (room_id)    REFERENCES rooms(id)    ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_exam (exam_id),
    INDEX idx_status (status)
);

-- Default admin user (password: admin123)
INSERT IGNORE INTO admin_login (username, email, password, name, role)
VALUES ('admin', 'admin@gbu.ac.in', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin');
