from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

    mysql_host: str = Field(default="localhost", alias="MYSQL_HOST")
    mysql_port: int = Field(default=3306, alias="MYSQL_PORT")
    mysql_database: str = Field(default="student_dropout", alias="MYSQL_DATABASE")
    mysql_user: str = Field(default="student_app", alias="MYSQL_USER")
    mysql_password: str = Field(default="student_app_password", alias="MYSQL_PASSWORD")
    database_url: str = Field(
        default="mysql+pymysql://student_app:student_app_password@localhost:3306/student_dropout",
        alias="DATABASE_URL",
    )
    cors_origins_raw: str = Field(default="http://localhost:3000", alias="BACKEND_CORS_ORIGINS")
    model_path: str = Field(default="backend/app/ml/artifacts/dropout_model.joblib", alias="MODEL_PATH")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
