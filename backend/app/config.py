from pydantic_settings import BaseSettings
from pydantic import field_validator
import os

# Create base dir for sqlite
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_URL = f"sqlite:///{os.path.join(BASE_DIR, 'ofs_tax.db')}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "NexTax Platform"
    # Fallback to sqlite if postgres is not provided in env
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # SECURITY: Must be set via environment variable. No hardcoded fallback.
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    GEMINI_API_KEY: str = ""
    
    # External APIs for PAN Verification / E-Filing
    EXTERNAL_API_KEY: str = ""
    EXTERNAL_API_SECRET: str = ""
    
    # Firebase project ID for verifying Google login ID tokens
    FIREBASE_PROJECT_ID: str = ""
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def jwt_secret_must_be_set(cls, v: str) -> str:
        if not v or v == "super_secret_jwt_key_for_development":
            raise ValueError(
                "CRITICAL: JWT_SECRET_KEY is not set or is using the insecure default. "
                "Set a strong random secret in your .env file. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
        return v
    
    class Config:
        env_file = (os.path.join(BASE_DIR, ".env"), ".env")

settings = Settings()
