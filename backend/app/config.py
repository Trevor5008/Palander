from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/palander"

    @field_validator("database_url", mode="before")
    @classmethod
    def use_psycopg2_driver(cls, value: str) -> str:
        if isinstance(value, str) and value.startswith("postgresql://"):
            return "postgresql+psycopg2://" + value.removeprefix("postgresql://")
        return value
    cors_origins: str = "http://localhost:5173"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
