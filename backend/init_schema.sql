-- Drop and create database
DROP DATABASE IF EXISTS simad_dropout_db;
CREATE DATABASE simad_dropout_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE simad_dropout_db;

-- 1. Table: users (User data & roles)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Administrator', 'Dean', 'Head of Department', 'Teacher') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: faculties (Rich metadata, linked to dean)
CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_name VARCHAR(100) NOT NULL UNIQUE,
    faculty_code VARCHAR(15) NOT NULL UNIQUE,
    dean_id INT NULL,
    established_year YEAR NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    FOREIGN KEY (dean_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Table: departments (Linked to faculty and HOD)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    faculty_id INT NOT NULL,
    hod_id INT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Table: courses (Catalog of courses)
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- 5. Table: classes (Basic class info, semester, linked to department)
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester ENUM('Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8') NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Table: student_records (Core student demographic & academic data)
CREATE TABLE student_records (
    student_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gpa DECIMAL(3,2) NOT NULL,
    attendance_rate DECIMAL(5,2) NOT NULL,
    financial_status ENUM('Stable', 'Unstable') NOT NULL,
    dropout_flag TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Table: class_students (Bridge: students enrolled in a class)
CREATE TABLE class_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student_records(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_student (class_id, student_id)
) ENGINE=InnoDB;

-- 8. Table: class_courses (Bridge: courses taught in a class with assigned teacher)
CREATE TABLE class_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_class_course (class_id, course_id)
) ENGINE=InnoDB;

-- 9. Table: data_imports (Audit trail for Excel/CSV uploads)
CREATE TABLE data_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    imported_by INT NULL,
    status ENUM('Success', 'Failed') NOT NULL,
    row_count INT DEFAULT 0,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
