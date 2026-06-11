from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas import UserCreate, UserResponse
from app.utils.auth import hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = hash_password(payload.password)
    user = User(
        username=payload.username,
        password_hash=hashed,
        role=payload.role,
        status=payload.status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.username:
        user.username = payload.username
    if payload.password:
        user.password_hash = hash_password(payload.password)
    if payload.role:
        user.role = payload.role
    if payload.status:
        user.status = payload.status
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
