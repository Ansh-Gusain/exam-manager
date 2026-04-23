USE exam_manager;

-- ── Name pools ────────────────────────────────────────────────────────────
-- 60 first names + 60 last names = 3600 unique combinations (enough for 2463)

DROP TEMPORARY TABLE IF EXISTS tmp_first;
CREATE TEMPORARY TABLE tmp_first (n INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50));
INSERT INTO tmp_first (name) VALUES
('Aarav'),('Aditya'),('Akash'),('Amit'),('Ananya'),('Anjali'),('Ankit'),('Ankita'),
('Arjun'),('Aryan'),('Ayesha'),('Bhavya'),('Chirag'),('Deepak'),('Deepika'),('Dhruv'),
('Divya'),('Gaurav'),('Harshit'),('Ishaan'),('Isha'),('Jatin'),('Kajal'),('Karan'),
('Kavya'),('Khushi'),('Kunal'),('Lakshmi'),('Manish'),('Mansi'),('Mayank'),('Meera'),
('Mohit'),('Muskan'),('Naman'),('Neha'),('Nikhil'),('Nikita'),('Nisha'),('Pankaj'),
('Pooja'),('Prachi'),('Pranav'),('Priya'),('Rahul'),('Raj'),('Rajan'),('Rajesh'),
('Ravi'),('Ritika'),('Rohit'),('Sachin'),('Sahil'),('Sakshi'),('Sanjay'),('Shivam'),
('Shreya'),('Siddharth'),('Simran'),('Sneha'),('Sonam'),('Suresh'),('Tanvi'),('Tarun'),
('Uday'),('Vaibhav'),('Vansh'),('Vikas'),('Vikram'),('Vishal'),('Yash'),('Zara');

DROP TEMPORARY TABLE IF EXISTS tmp_last;
CREATE TEMPORARY TABLE tmp_last (n INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50));
INSERT INTO tmp_last (name) VALUES
('Agarwal'),('Arora'),('Bansal'),('Bhatia'),('Chauhan'),('Chawla'),('Chopra'),('Desai'),
('Dubey'),('Garg'),('Goyal'),('Gupta'),('Jain'),('Joshi'),('Kapoor'),('Kaur'),
('Khanna'),('Kumar'),('Malhotra'),('Mehta'),('Mishra'),('Mittal'),('Nair'),('Pandey'),
('Patel'),('Pathak'),('Pillai'),('Prasad'),('Rao'),('Rastogi'),('Reddy'),('Saxena'),
('Shah'),('Sharma'),('Shukla'),('Singh'),('Sinha'),('Srivastava'),('Tiwari'),('Trivedi'),
('Tyagi'),('Upadhyay'),('Varma'),('Verma'),('Yadav'),('Ahuja'),('Bajaj'),('Bose'),
('Chatterjee'),('Das'),('Dutta'),('Ghosh'),('Iyer'),('Krishnan'),('Menon'),('Mukherjee'),
('Murthy'),('Naidu'),('Nambiar'),('Rajan'),('Rathore'),('Sengupta'),('Sethi'),('Walia');

-- ── Assign names using id to pick from pools ──────────────────────────────
-- first_name = tmp_first row ((id-1) % 72 + 1)
-- last_name  = tmp_last  row (((id-1) / 72) % 64 + 1)
-- This gives 72 × 64 = 4608 unique combos, more than enough

UPDATE students s
JOIN tmp_first f ON f.n = ((s.id - 1) % 72) + 1
JOIN tmp_last  l ON l.n = (FLOOR((s.id - 1) / 72) % 64) + 1
SET s.name = CONCAT(f.name, ' ', l.name);

DROP TEMPORARY TABLE IF EXISTS tmp_first;
DROP TEMPORARY TABLE IF EXISTS tmp_last;

-- Verify
SELECT id, roll_number, name, branch, batch FROM students ORDER BY id LIMIT 15;
SELECT COUNT(*) as total, SUM(name LIKE '%-%-%-0%') as old_format FROM students;
