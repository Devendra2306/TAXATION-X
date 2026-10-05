from pydantic_settings import BaseSettings
import os

# Create base dir for sqlite
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_URL = f"sqlite:///{os.path.join(BASE_DIR, 'ofs_tax.db')}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "NexTax Platform"
    # Fallback to sqlite if postgres is not provided in env
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    JWT_SECRET_KEY: str = "super_secret_jwt_key_for_development"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    GEMINI_API_KEY: str = ""
    
    # External APIs for PAN Verification / E-Filing
    EXTERNAL_API_KEY: str = ""
    EXTERNAL_API_SECRET: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
