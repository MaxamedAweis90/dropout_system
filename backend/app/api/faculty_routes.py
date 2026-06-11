from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.faculty import Faculty
from app.models.user import User
from app.schemas import DeanResponse, FacultyCreate, FacultyResponse, FacultyUpdate

faculties_router = APIRouter(prefix="/faculties", tags=["faculties"])
deans_router = APIRouter(prefix="/deans", tags=["deans"])


@faculties_router.get("/", response_model=list[FacultyResponse])
def list_faculties(db: Session = Depends(get_db)):
    return db.query(Faculty).order_by(Faculty.id).all()


@faculties_router.post("/", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def create_faculty(payload: FacultyCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Faculty)
        .filter(
            (Faculty.faculty_name == payload.faculty_name)
            | (Faculty.faculty_code == payload.faculty_code)
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Faculty name or code already exists")

    faculty = Faculty(**payload.model_dump())
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@faculties_router.put("/{faculty_id}", response_model=FacultyResponse)
def update_faculty(faculty_id: int, payload: FacultyUpdate, db: Session = Depends(get_db)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(faculty, field, value)

    db.commit()
    db.refresh(faculty)
    return faculty


@faculties_router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(faculty)
    db.commit()
    return None


@deans_router.get("/", response_model=list[DeanResponse])
def list_deans(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "Dean").order_by(User.id).all()
