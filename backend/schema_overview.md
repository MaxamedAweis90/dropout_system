# Database Schema Overview for Student Dropout Prediction System

**File:** `backend/init_schema.sql`

---

## 📋 Table of Contents
1. [Introduction](#introduction)
2. [Users Table](#users-table)
3. [Faculties Table](#faculties-table)
4. [Departments Table](#departments-table)
5. [Courses Table](#courses-table)
6. [Classes Table](#classes-table)
7. [Class‑Students Bridge](#class‑students-bridge)
8. [Class‑Courses Bridge](#class‑courses-bridge)
9. [Data Imports Audit](#data-imports-audit)
10. [Student Records (placeholder)](#student-records)
11. [How to Locate Each Section in the SQL File](#locating‑sections)
12. [Next Steps / Usage](#next-steps)

---

## <a id="introduction"></a>🧭 Introduction
This file creates a **MySQL** schema (`simad_dropout_db`) that stores all data needed for the
student‑dropout‑prediction platform (frontend = Next.js, backend = FastAPI, analytics = Pandas).
It follows **Third Normal Form (3NF)**, uses **foreign keys** for referential integrity, and
defines **RBAC** roles for secure access.

---

## <a id="users-table"></a>👤 Users Table
```sql
-- Lines 9‑13 (original file)
9:     username VARCHAR(50) NOT NULL UNIQUE,
10:    password_hash VARCHAR(255) NOT NULL,
11:    role ENUM('Administrator', 'Dean', 'Head of Department', 'Teacher') NOT NULL,
12:    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
13: ) ENGINE=InnoDB;
```
**Purpose:** Stores authentication credentials and the role of each system user.
- **Administrator** – full system rights.
- **Dean** – view data for their faculty only.
- **Head of Department** – view data for their department only.
- **Teacher** – manage classes they are assigned to.

---

## <a id="faculties-table"></a>🏛️ Faculties Table
```sql
-- Lines 15‑24
15: -- 2. Table: faculties (Rich metadata, linked to dean)
16: CREATE TABLE faculties (
17:    id INT AUTO_INCREMENT PRIMARY KEY,
18:    faculty_name VARCHAR(100) NOT NULL UNIQUE,
19:    faculty_code VARCHAR(15) NOT NULL UNIQUE,
20:    dean_id INT NULL,
21:    established_year YEAR NOT NULL,
22:    status ENUM('Active', 'Inactive') DEFAULT 'Active',
23:    FOREIGN KEY (dean_id) REFERENCES users(id) ON DELETE SET NULL
24: ) ENGINE=InnoDB;
```
**Purpose:** Holds faculty‑level metadata and links each faculty to its **Dean** (`dean_id`).
The `status` column lets the admin deactivate a faculty without losing history.

---

## <a id="departments-table"></a>🗂️ Departments Table
```sql
-- Lines 26‑34
26: -- 3. Table: departments (Linked to faculty and HOD)
27: CREATE TABLE departments (
28:    id INT AUTO_INCREMENT PRIMARY KEY,
29:    department_name VARCHAR(100) NOT NULL UNIQUE,
30:    faculty_id INT NOT NULL,
31:    hod_id INT NULL,
32:    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
33:    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL
34: ) ENGINE=InnoDB;
```
**Purpose:** Represents academic departments. Each department belongs to a **faculty** and may have a **Head of Department** (`hod_id`).
Cascade delete ensures that removing a faculty automatically removes its departments.

---

## <a id="courses-table"></a>📚 Courses Table
```sql
-- Lines 36‑41
36: -- 4. Table: courses (Catalog of courses)
37: CREATE TABLE courses (
38:    id INT AUTO_INCREMENT PRIMARY KEY,
39:    course_code VARCHAR(20) NOT NULL UNIQUE,
40:    course_name VARCHAR(100) NOT NULL
41: ) ENGINE=InnoDB;
```
**Purpose:** Simple lookup table for every course offered. `course_code` is the unique identifier used in the bridge tables.

---

## <a id="classes-table"></a>🏫 Classes Table
```sql
-- Lines 43‑47 (and following lines for foreign key)
43: -- 5. Table: classes (Basic class info, semester, linked to department)
44: CREATE TABLE classes (
45:    id INT AUTO_INCREMENT PRIMARY KEY,
46:    class_name VARCHAR(50) NOT NULL,
47:    academic_year VARCHAR(20) NOT NULL,
... (semester, department_id, foreign key)
```
**Purpose:** Stores each class (e.g., `CA221`) together with the academic year and semester. Linked to a **department**.

---

## <a id="class‑students-bridge"></a>🔗 Class‑Students Bridge
(Located later in the file; see lines around 70‑78 in the original script.)
```sql
CREATE TABLE class_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student_records(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_student (class_id, student_id)
) ENGINE=InnoDB;
```
**Purpose:** Many‑to‑many relationship between **students** and **classes**.
Ensures a student can be enrolled in multiple classes and a class can have many students.

---

## <a id="class‑courses-bridge"></a>🔗 Class‑Courses Bridge
(Located later; see lines around 84‑93.)
```sql
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
```
**Purpose:** Connects a **class** to the **courses** it teaches and assigns a **teacher**. Allows multiple teachers per class via additional rows if needed.

---

## <a id="data-imports-audit"></a>🗃️ Data Imports Audit
(Located near the end of the script.)
```sql
CREATE TABLE data_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    imported_by INT NULL,
    status ENUM('Success', 'Failed') NOT NULL,
    row_count INT DEFAULT 0,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
```
**Purpose:** Keeps a log of every Excel/CSV bulk upload performed by an **Administrator**. Useful for debugging and audit trails.

---

## <a id="student-records"></a>👨‍🎓 Student Records (placeholder)
The original specification mentions a `student_records` table that stores each student's GPA, attendance, financial status, etc. The exact DDL was omitted from the snippet you viewed, but the foreign‑key references in `class_students` expect this table to exist:
```sql
CREATE TABLE student_records (
    student_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    current_gpa DECIMAL(3,2),
    attendance_rate DECIMAL(5,2),
    financial_status ENUM('Paid', 'Pending', 'Scholarship')
    -- additional columns for the ML model can be added here
) ENGINE=InnoDB;
```
Add this table before the bridge tables if it does not already exist.

---

## <a id="locating‑sections"></a>🔎 How to Locate Each Section in the SQL File
| Section | Line range (as shown in `init_schema.sql`) |
|--------|--------------------------------------------|
| Users | 9‑13 |
| Faculties | 15‑24 |
| Departments | 26‑34 |
| Courses | 36‑41 |
| Classes (basic columns) | 43‑47 (continued to ~55 for `semester` and `department_id`) |
| Class‑Students bridge | ~70‑78 |
| Class‑Courses bridge | ~84‑93 |
| Data Imports audit | ~100‑108 |
| Student Records (to be added) | **before** the bridge tables (e.g., after line 65) |

> **Tip:** Open the file in any editor, jump to the line number (e.g., `Ctrl+G` → `15`) to edit a specific table.

---

## <a id="next-steps"></a>🚀 Next Steps / Usage
1. **Run the script** in phpMyAdmin or MySQL CLI to create the schema.
2. **Add the missing `student_records` table** (see the placeholder above) before the bridge tables.
3. Configure **FastAPI** to use this database (connection string in `backend/.env`).
4. Implement the **Excel upload endpoint** that validates columns with Pandas and populates `class_students`.
5. Build the **Next.js dashboard** – query the tables according to the user’s role (RBAC).

Feel free to ask for sample FastAPI endpoint code, Pandas validation snippets, or UI mock‑ups!
