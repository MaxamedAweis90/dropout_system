from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.student import StudentRecord
from app.models.prediction import PredictionHistory
from app.models.user import User
from app.models.faculty import Faculty

# Realistic list of SIMAD University students and their academic features
MOCK_STUDENTS = [
    {
        "student_id": "STU1001",
        "name": "Ahmed Hassan",
        "program": "Software Eng.",
        "age": 21,
        "attendance_rate": 58.5,
        "gpa": 1.75,
        "credits_passed": 12,
        "financial_strain_score": 0.8,
        "study_hours_per_week": 8.0,
        "has_scholarship": False,
        "first_generation_student": True,
        "prediction": {
            "dropout_probability": 0.78,
            "risk_level": "high",
            "recommendation": "Schedule academic advising and financial support review."
        }
    },
    {
        "student_id": "STU1002",
        "name": "Fatima Ali",
        "program": "Accounting",
        "age": 22,
        "attendance_rate": 62.0,
        "gpa": 1.95,
        "credits_passed": 15,
        "financial_strain_score": 0.6,
        "study_hours_per_week": 10.0,
        "has_scholarship": False,
        "first_generation_student": False,
        "prediction": {
            "dropout_probability": 0.72,
            "risk_level": "high",
            "recommendation": "Monitor progress and intervene with tutoring or counseling."
        }
    },
    {
        "student_id": "STU1003",
        "name": "Abdi Noor",
        "program": "Civil Eng.",
        "age": 23,
        "attendance_rate": 70.2,
        "gpa": 2.10,
        "credits_passed": 18,
        "financial_strain_score": 0.7,
        "study_hours_per_week": 12.0,
        "has_scholarship": True,
        "first_generation_student": True,
        "prediction": {
            "dropout_probability": 0.65,
            "risk_level": "medium",
            "recommendation": "Monitor progress and intervene with tutoring or counseling."
        }
    },
    {
        "student_id": "STU1004",
        "name": "Amina Yusuf",
        "program": "Nursing",
        "age": 20,
        "attendance_rate": 65.5,
        "gpa": 2.05,
        "credits_passed": 14,
        "financial_strain_score": 0.5,
        "study_hours_per_week": 9.5,
        "has_scholarship": False,
        "first_generation_student": True,
        "prediction": {
            "dropout_probability": 0.70,
            "risk_level": "high",
            "recommendation": "Schedule academic advising and financial support review."
        }
    },
    {
        "student_id": "STU1005",
        "name": "Mohamed Ibrahim",
        "program": "Finance",
        "age": 24,
        "attendance_rate": 50.0,
        "gpa": 1.50,
        "credits_passed": 10,
        "financial_strain_score": 0.9,
        "study_hours_per_week": 6.0,
        "has_scholarship": False,
        "first_generation_student": True,
        "prediction": {
            "dropout_probability": 0.88,
            "risk_level": "high",
            "recommendation": "Schedule academic advising and financial support review."
        }
    },
    {
        "student_id": "STU1006",
        "name": "Maryam Ali",
        "program": "Software Eng.",
        "age": 19,
        "attendance_rate": 95.0,
        "gpa": 3.85,
        "credits_passed": 24,
        "financial_strain_score": 0.1,
        "study_hours_per_week": 22.0,
        "has_scholarship": True,
        "first_generation_student": False,
        "prediction": {
            "dropout_probability": 0.03,
            "risk_level": "low",
            "recommendation": "Continue normal academic support and periodic monitoring."
        }
    },
    {
        "student_id": "STU1007",
        "name": "Yusuf Abdullahi",
        "program": "Electrical Eng.",
        "age": 21,
        "attendance_rate": 91.5,
        "gpa": 3.20,
        "credits_passed": 20,
        "financial_strain_score": 0.3,
        "study_hours_per_week": 18.0,
        "has_scholarship": False,
        "first_generation_student": True,
        "prediction": {
            "dropout_probability": 0.08,
            "risk_level": "low",
            "recommendation": "Continue normal academic support and periodic monitoring."
        }
    },
    {
        "student_id": "STU1008",
        "name": "Deqa Farah",
        "program": "Public Health",
        "age": 20,
        "attendance_rate": 88.0,
        "gpa": 3.45,
        "credits_passed": 22,
        "financial_strain_score": 0.2,
        "study_hours_per_week": 15.5,
        "has_scholarship": True,
        "first_generation_student": False,
        "prediction": {
            "dropout_probability": 0.05,
            "risk_level": "low",
            "recommendation": "Continue normal academic support and periodic monitoring."
        }
    },
    {
        "student_id": "STU1009",
        "name": "Khadar Omar",
        "program": "Islamic Studies",
        "age": 22,
        "attendance_rate": 78.0,
        "gpa": 2.80,
        "credits_passed": 18,
        "financial_strain_score": 0.4,
        "study_hours_per_week": 12.0,
        "has_scholarship": False,
        "first_generation_student": True,
        "prediction": {
            "dropout_probability": 0.18,
            "risk_level": "low",
            "recommendation": "Continue normal academic support and periodic monitoring."
        }
    },
    {
        "student_id": "STU1010",
        "name": "Sahra Jama",
        "program": "Sharia",
        "age": 21,
        "attendance_rate": 84.5,
        "gpa": 2.95,
        "credits_passed": 20,
        "financial_strain_score": 0.35,
        "study_hours_per_week": 14.0,
        "has_scholarship": False,
        "first_generation_student": False,
        "prediction": {
            "dropout_probability": 0.12,
            "risk_level": "low",
            "recommendation": "Continue normal academic support and periodic monitoring."
        }
    }
]

def seed_database(db: Session) -> None:
    # Seed users if empty
    existing_users = db.scalar(select(func.count(User.id))) or 0
    if existing_users == 0:
        print("Seeding database with initial users (deans)...")
        deans = [
            User(id=101, username="Dr. Maxamed Cali", password_hash="hashed_pw", role="Dean"),
            User(id=102, username="Prof. Caasho Axmed", password_hash="hashed_pw", role="Dean"),
            User(id=103, username="Eng. Xasan Daahir", password_hash="hashed_pw", role="Dean"),
            User(id=104, username="Dr. Cilmi Cumar", password_hash="hashed_pw", role="Dean"),
        ]
        for dean in deans:
            db.add(dean)
        db.commit()

    # Seed faculties if empty
    existing_faculties = db.scalar(select(func.count(Faculty.id))) or 0
    if existing_faculties == 0:
        print("Seeding database with initial faculties...")
        faculties = [
            Faculty(id=1, faculty_name="Computer Science", faculty_code="FOC", dean_id=101, established_year=2011, students_count=650, status="Active"),
            Faculty(id=2, faculty_name="Business", faculty_code="FOB", dean_id=102, established_year=2012, students_count=520, status="Active"),
            Faculty(id=3, faculty_name="Engineering", faculty_code="FOE", dean_id=103, established_year=2015, students_count=580, status="Active"),
            Faculty(id=4, faculty_name="Health Sciences", faculty_code="FOHS", dean_id=104, established_year=2018, students_count=420, status="Active"),
            Faculty(id=5, faculty_name="Education", faculty_code="FOED", dean_id=None, established_year=2020, students_count=330, status="Inactive"),
        ]
        for fac in faculties:
            db.add(fac)
        db.commit()

    # Check if we already have students in the database
    existing_count = db.scalar(select(func.count(StudentRecord.id))) or 0
    if existing_count > 0:
        print(f"Database already contains {existing_count} student records. Skipping student seeding.")
        return

    print("Seeding database with initial student records and prediction logs...")
    for item in MOCK_STUDENTS:
        # Create student record
        student = StudentRecord(
            student_id=item["student_id"],
            name=item["name"],
            program=item["program"],
            age=item["age"],
            attendance_rate=item["attendance_rate"],
            gpa=item["gpa"],
            credits_passed=item["credits_passed"],
            financial_strain_score=item["financial_strain_score"],
            study_hours_per_week=item["study_hours_per_week"],
            has_scholarship=item["has_scholarship"],
            first_generation_student=item["first_generation_student"]
        )
        db.add(student)
        
        # Create prediction history record
        pred_data = item["prediction"]
        prediction = PredictionHistory(
            student_id=item["student_id"],
            dropout_probability=pred_data["dropout_probability"],
            risk_level=pred_data["risk_level"],
            recommendation=pred_data["recommendation"]
        )
        db.add(prediction)

    db.commit()
    print("Database seeding completed successfully.")
