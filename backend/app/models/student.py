from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StudentRecord(Base):
    __tablename__ = "student_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True, index=True)
    program: Mapped[str | None] = mapped_column(String(120), nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    attendance_rate: Mapped[float] = mapped_column(Float, nullable=False)
    gpa: Mapped[float] = mapped_column(Float, nullable=False)
    credits_passed: Mapped[int] = mapped_column(Integer, nullable=False)
    financial_strain_score: Mapped[float] = mapped_column(Float, nullable=False)
    study_hours_per_week: Mapped[float] = mapped_column(Float, nullable=False)
    has_scholarship: Mapped[bool] = mapped_column(Boolean, default=False)
    first_generation_student: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
