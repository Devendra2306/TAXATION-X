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
    
    # PayU Payment Gateway Test Credentials
    PAYU_KEY: str = "BH6b9r"
    PAYU_SALT: str = "SdXEkaKbj0fJqijOYSF6mmfCQtqfrVmf"
    PAYU_CLIENT_ID: str = "85d529228846f396e194c235d7301fdb46f8e31684271765d590a09d98d1d926"
    PAYU_CLIENT_SECRET: str = "c89d1685babf150c237b071cdd58622d14ad71161878077158049faae7a35c0c"
    PAYU_ENV: str = "test"  # test or prod
    PAYU_TEST_URL: str = "https://test.payu.in/_payment"
    PAYU_PROD_URL: str = "https://secure.payu.in/_payment"
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
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
