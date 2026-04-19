-- Exam Manager Database Schema
-- Run: mysql -u root -p < backend/database/schema.sql

CREATE DATABASE IF NOT EXISTS exam_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exam_manager;

-- Users (auth)
CREATE TABLE IF NOT EXISTS users (
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
    section     VARCHAR(5) NOT NULL,
    session     VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_branch (branch),
    INDEX idx_semester (semester),
    INDEX idx_school (school)
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    employee_id  VARCHAR(20) UNIQUE NOT NULL,
    name         VARCHAR(150) NOT NULL,
    school       VARCHAR(20) NOT NULL,
    department   VARCHAR(50) NOT NULL,
    branch       VARCHAR(50) NOT NULL,
    designation  VARCHAR(50) NOT NULL,
    email        VARCHAR(150) NULL,
    phone        VARCHAR(20) NULL,
    total_duties INT NOT NULL DEFAULT 0,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    UNIQUE KEY uq_invigilation (exam_id, room_id),
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

-- Replacement Logs
CREATE TABLE IF NOT EXISTS replacement_logs (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    exam_id                INT NOT NULL,
    room_id                INT NOT NULL,
    original_faculty_id    INT NOT NULL,
    replacement_faculty_id INT NULL,
    reason                 TEXT NOT NULL,
    status                 ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requested_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at            TIMESTAMP NULL,
    FOREIGN KEY (exam_id)                 REFERENCES exams(id)   ON DELETE CASCADE,
    FOREIGN KEY (room_id)                 REFERENCES rooms(id)   ON DELETE CASCADE,
    FOREIGN KEY (original_faculty_id)     REFERENCES faculty(id) ON DELETE CASCADE,
    FOREIGN KEY (replacement_faculty_id)  REFERENCES faculty(id) ON DELETE SET NULL,
    INDEX idx_exam (exam_id),
    INDEX idx_status (status)
);

-- Default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password, name, role)
VALUES ('admin', 'admin@gbu.ac.in', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin');

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(150) NOT NULL,
    token      VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used       TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email)
);
