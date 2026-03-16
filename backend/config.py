import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Database
    DB_PATH: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

    # Upload
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    MAX_ROWS: int = 1_000_000
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "uploads")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-3.1-flash-lite-preview"

    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Rate limiting
    QUERY_RATE_LIMIT: str = "15/minute"
    UPLOAD_RATE_LIMIT: str = "5/minute"

    # Query
    MAX_QUERY_ROWS: int = 10_000
    QUERY_TIMEOUT: int = 30

    # Cache
    CACHE_TTL: int = 300  # 5 minutes

    # Default table
    DEFAULT_TABLE: str = "youtube_data"


settings = Settings()

# ---------------------------------------------------------------------------
# Rate limiter (shared so both main.py and routes can import without circular)
# ---------------------------------------------------------------------------
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)