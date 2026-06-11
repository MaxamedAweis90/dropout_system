USE simad_dropout_db;

-- Insert Mock Deans
INSERT INTO users (id, username, password_hash, role) VALUES
(101, 'Dr. Maxamed Cali', 'hashed_pw', 'Dean'),
(102, 'Prof. Caasho Axmed', 'hashed_pw', 'Dean'),
(103, 'Eng. Xasan Daahir', 'hashed_pw', 'Dean'),
(104, 'Dr. Cilmi Cumar', 'hashed_pw', 'Dean')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- Insert Mock Faculties
INSERT INTO faculties (id, faculty_name, faculty_code, dean_id, established_year, status) VALUES
(1, 'Computer Science', 'FOC', 101, 2011, 'Active'),
(2, 'Business', 'FOB', 102, 2012, 'Active'),
(3, 'Engineering', 'FOE', 103, 2015, 'Active'),
(4, 'Health Sciences', 'FOHS', 104, 2018, 'Active'),
(5, 'Education', 'FOED', NULL, 2020, 'Inactive')
ON DUPLICATE KEY UPDATE 
    faculty_name=VALUES(faculty_name),
    faculty_code=VALUES(faculty_code),
    dean_id=VALUES(dean_id),
    established_year=VALUES(established_year),
    status=VALUES(status);
