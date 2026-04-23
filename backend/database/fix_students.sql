-- ============================================================
-- Student Records Fix
-- Current date context: April 2026 (Jan-May = EVEN semesters)
--
-- Batch rules:
--   Batch YYYY-YYYY+4 (4-yr):
--     1st yr: sem I/II,   session YYYY-(YYYY+1)
--     2nd yr: sem III/IV, session (YYYY+1)-(YYYY+2)
--     3rd yr: sem V/VI,   session (YYYY+2)-(YYYY+3)
--     4th yr: sem VII/VIII, session (YYYY+3)-(YYYY+4)
--   ICS (5-yr): add one more year
--
--   Odd sems  (I,III,V,VII)  → Aug-Dec
--   Even sems (II,IV,VI,VIII)→ Jan-May
--
-- Roll number format: YY5BBBNN (9 chars exactly)
--   YY  = last 2 digits of batch start year
--   5   = fixed
--   BBB = branch code (3 chars)
--   NNN = 3-digit sequential number (001-999)
--
-- Branch codes (3-char):
--   CSE→UCS, AI→UAI, DS→UDS, CYB→UCY, ML→UML
--   ICS→ICS, BIT→UIT, BCA→UCA, ECE→UEC, EC-AIML→UEA
-- ============================================================

USE exam_manager;

-- Step 1: Delete all existing student records
DELETE FROM attendance_records;
DELETE FROM seating_allocations;
DELETE FROM invigilation_allocations;
DELETE FROM students;
ALTER TABLE students AUTO_INCREMENT = 1;

-- Step 2: Re-insert correct student records
-- April 2026 = Jan-May 2026 = EVEN semesters running
-- Active batches and their current state:
--
--  Batch 2025-2029 → 1st year → sem II  → session 2025-2026
--  Batch 2024-2028 → 2nd year → sem IV  → session 2025-2026
--  Batch 2023-2027 → 3rd year → sem VI  → session 2025-2026
--  Batch 2022-2026 → 4th year → sem VIII→ session 2025-2026
--  Batch 2022-2027 (ICS 5yr) → 4th year → sem VIII → session 2025-2026
--  Batch 2021-2026 (ICS 5yr) → 5th year → sem X   → session 2025-2026
--  Batch 2023-2028 (ICS 5yr) → 3rd year → sem VI  → session 2025-2026
--  Batch 2024-2029 (ICS 5yr) → 2nd year → sem IV  → session 2025-2026

-- ── Helper procedure to insert a batch of students ──────────────────────
DROP PROCEDURE IF EXISTS insert_students;
DELIMITER //
CREATE PROCEDURE insert_students(
    IN p_branch     VARCHAR(20),
    IN p_school     VARCHAR(20),
    IN p_department VARCHAR(50),
    IN p_semester   TINYINT,
    IN p_year       VARCHAR(10),
    IN p_session    VARCHAR(20),
    IN p_batch      VARCHAR(20),
    IN p_type       VARCHAR(10),
    IN p_roll_prefix VARCHAR(6),   -- e.g. "235UCS" (6 chars: YY5BBB)
    IN p_start_num  INT,
    IN p_count      INT
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE roll VARCHAR(9);
    DECLARE sname VARCHAR(150);
    WHILE i < p_count DO
        SET roll = CONCAT(p_roll_prefix, LPAD(p_start_num + i, 3, '0'));
        SET sname = CONCAT(p_branch, '-', p_batch, '-', LPAD(p_start_num + i, 3, '0'));
        INSERT INTO students (roll_number, name, school, department, branch, semester, year, session, batch, type)
        VALUES (roll, sname, p_school, p_department, p_branch, p_semester, p_year, p_session, p_batch, p_type);
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- ════════════════════════════════════════════════════════════════
-- BATCH 2025-2029  →  1st Year  →  Sem II  →  Session 2025-2026
-- ════════════════════════════════════════════════════════════════
-- CSE: 120 regular
CALL insert_students('CSE','SOICT','Computer Science',2,'1st Year','2025-2026','2025-2029','regular','255UCS',1,120);
-- AI: 80 regular
CALL insert_students('AI','SOICT','Computer Science',2,'1st Year','2025-2026','2025-2029','regular','255UAI',1,80);
-- DS: 60 regular
CALL insert_students('DS','SOICT','Computer Science',2,'1st Year','2025-2026','2025-2029','regular','255UDS',1,60);
-- CYB: 50 regular
CALL insert_students('CYB','SOICT','Computer Science',2,'1st Year','2025-2026','2025-2029','regular','255UCY',1,50);
-- ML: 50 regular
CALL insert_students('ML','SOICT','Computer Science',2,'1st Year','2025-2026','2025-2029','regular','255UML',1,50);
-- BIT: 60 regular
CALL insert_students('BIT','SOICT','Information Technology',2,'1st Year','2025-2026','2025-2029','regular','255UIT',1,60);
-- BCA: 60 regular
CALL insert_students('BCA','SOICT','Information Technology',2,'1st Year','2025-2026','2025-2029','regular','255UCA',1,60);
-- ECE: 60 regular
CALL insert_students('ECE','SOICT','Electronics',2,'1st Year','2025-2026','2025-2029','regular','255UEC',1,60);
-- EC-AIML: 40 regular
CALL insert_students('EC-AIML','SOICT','Electronics',2,'1st Year','2025-2026','2025-2029','regular','255UEA',1,40);

-- ════════════════════════════════════════════════════════════════
-- BATCH 2024-2028  →  2nd Year  →  Sem IV  →  Session 2025-2026
-- ════════════════════════════════════════════════════════════════
-- CSE: 120 regular
CALL insert_students('CSE','SOICT','Computer Science',4,'2nd Year','2025-2026','2024-2028','regular','245UCS',1,120);
-- AI: 80 regular
CALL insert_students('AI','SOICT','Computer Science',4,'2nd Year','2025-2026','2024-2028','regular','245UAI',1,80);
-- DS: 60 regular
CALL insert_students('DS','SOICT','Computer Science',4,'2nd Year','2025-2026','2024-2028','regular','245UDS',1,60);
-- CYB: 50 regular
CALL insert_students('CYB','SOICT','Computer Science',4,'2nd Year','2025-2026','2024-2028','regular','245UCY',1,50);
-- ML: 50 regular
CALL insert_students('ML','SOICT','Computer Science',4,'2nd Year','2025-2026','2024-2028','regular','245UML',1,50);
-- BIT: 60 regular
CALL insert_students('BIT','SOICT','Information Technology',4,'2nd Year','2025-2026','2024-2028','regular','245UIT',1,60);
-- BCA: 60 regular
CALL insert_students('BCA','SOICT','Information Technology',4,'2nd Year','2025-2026','2024-2028','regular','245UCA',1,60);
-- ECE: 60 regular
CALL insert_students('ECE','SOICT','Electronics',4,'2nd Year','2025-2026','2024-2028','regular','245UEC',1,60);
-- EC-AIML: 40 regular
CALL insert_students('EC-AIML','SOICT','Electronics',4,'2nd Year','2025-2026','2024-2028','regular','245UEA',1,40);
-- ICS (5-yr): 60 regular
CALL insert_students('ICS','SOICT','Computer Science',4,'2nd Year','2025-2026','2024-2029','regular','245ICS',1,60);

-- ════════════════════════════════════════════════════════════════
-- BATCH 2023-2027  →  3rd Year  →  Sem VI  →  Session 2025-2026
-- ════════════════════════════════════════════════════════════════
-- CSE: 120 regular + 10 repeater
CALL insert_students('CSE','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2027','regular','235UCS',1,120);
CALL insert_students('CSE','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2027','repeater','235UCS',121,10);
-- AI: 80 regular + 8 repeater
CALL insert_students('AI','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2027','regular','235UAI',1,80);
CALL insert_students('AI','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2027','repeater','235UAI',81,8);
-- DS: 60 regular
CALL insert_students('DS','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2027','regular','235UDS',1,60);
-- CYB: 50 regular
CALL insert_students('CYB','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2027','regular','235UCY',1,50);
-- ML: 50 regular
CALL insert_students('ML','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2027','regular','235UML',1,50);
-- BIT: 60 regular
CALL insert_students('BIT','SOICT','Information Technology',6,'3rd Year','2025-2026','2023-2027','regular','235UIT',1,60);
-- BCA: 60 regular
CALL insert_students('BCA','SOICT','Information Technology',6,'3rd Year','2025-2026','2023-2027','regular','235UCA',1,60);
-- ECE: 60 regular
CALL insert_students('ECE','SOICT','Electronics',6,'3rd Year','2025-2026','2023-2027','regular','235UEC',1,60);
-- EC-AIML: 40 regular
CALL insert_students('EC-AIML','SOICT','Electronics',6,'3rd Year','2025-2026','2023-2027','regular','235UEA',1,40);
-- ICS (5-yr): 60 regular
CALL insert_students('ICS','SOICT','Computer Science',6,'3rd Year','2025-2026','2023-2028','regular','235ICS',1,60);

-- ════════════════════════════════════════════════════════════════
-- BATCH 2022-2026  →  4th Year  →  Sem VIII →  Session 2025-2026
-- ════════════════════════════════════════════════════════════════
-- CSE: 100 regular + 15 repeater
CALL insert_students('CSE','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2026','regular','225UCS',1,100);
CALL insert_students('CSE','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2026','repeater','225UCS',101,15);
-- AI: 70 regular + 10 repeater
CALL insert_students('AI','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2026','regular','225UAI',1,70);
CALL insert_students('AI','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2026','repeater','225UAI',71,10);
-- DS: 50 regular
CALL insert_students('DS','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2026','regular','225UDS',1,50);
-- CYB: 40 regular
CALL insert_students('CYB','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2026','regular','225UCY',1,40);
-- ML: 40 regular
CALL insert_students('ML','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2026','regular','225UML',1,40);
-- BIT: 50 regular
CALL insert_students('BIT','SOICT','Information Technology',8,'4th Year','2025-2026','2022-2026','regular','225UIT',1,50);
-- BCA: 50 regular
CALL insert_students('BCA','SOICT','Information Technology',8,'4th Year','2025-2026','2022-2026','regular','225UCA',1,50);
-- ECE: 50 regular
CALL insert_students('ECE','SOICT','Electronics',8,'4th Year','2025-2026','2022-2026','regular','225UEC',1,50);
-- EC-AIML: 30 regular
CALL insert_students('EC-AIML','SOICT','Electronics',8,'4th Year','2025-2026','2022-2026','regular','225UEA',1,30);

-- ════════════════════════════════════════════════════════════════
-- BATCH 2022-2027 (ICS 5-yr) → 4th Year → Sem VIII → Session 2025-2026
-- ════════════════════════════════════════════════════════════════
CALL insert_students('ICS','SOICT','Computer Science',8,'4th Year','2025-2026','2022-2027','regular','225ICS',1,50);

-- ════════════════════════════════════════════════════════════════
-- BATCH 2021-2026 (ICS 5-yr) → 5th Year → Sem X → Session 2025-2026
-- ════════════════════════════════════════════════════════════════
CALL insert_students('ICS','SOICT','Computer Science',10,'5th Year','2025-2026','2021-2026','regular','215ICS',1,30);

-- Cleanup
DROP PROCEDURE IF EXISTS insert_students;

-- Verify
SELECT batch, branch, semester, year, session, type,
       LEFT(roll_number,6) as roll_prefix,
       COUNT(*) as cnt
FROM students
GROUP BY batch, branch, semester, year, session, type, roll_prefix
ORDER BY batch, branch, semester;
