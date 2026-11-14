import os
import pytest

# Ensure standard test environment variables are loaded before any app module imports Settings
os.environ.setdefault("JWT_SECRET_KEY", "test_super_secure_random_jwt_secret_key_for_testing_only_123456789")
os.environ.setdefault("DEMO_MODE", "false")
os.environ.setdefault("EXTERNAL_API_KEY", "test_mock_sandbox_api_key")
os.environ.setdefault("EXTERNAL_API_SECRET", "test_mock_sandbox_api_secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
