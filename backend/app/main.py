from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin_routes import admin_router
from app.api.auth import router as auth_router
from app.api.faculty_routes import deans_router, faculties_router
from app.api.routes import api_router
from app.api.user_routes import router as users_router
from app.core.config import settings

app = FastAPI(
    title="Student Dropout Prediction API",
    description="API for risk scoring and student dropout analytics",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(users_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(faculties_router, prefix="/api")
app.include_router(deans_router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Student Dropout Prediction API is running."}
