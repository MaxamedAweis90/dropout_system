from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    faculty_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    faculty_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    dean_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    established_year: Mapped[int] = mapped_column(Integer, nullable=False)
    students_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)

    dean = relationship("User", back_populates="faculties")
