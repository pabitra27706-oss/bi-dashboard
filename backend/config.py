import os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

# Load environment variables
load_dotenv()

class Settings:
    # Database
    DB_PATH: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")
    
    # Upload
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    MAX_ROWS: int = 1_000_000
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "uploads")
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-3.1-flash-lite-preview"
    KEY_COOLDOWN_SECONDS: int = int(os.getenv("KEY_COOLDOWN_SECONDS", "60"))
    
    # CORS - Will be set from environment variable
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    # Rate limiting
    QUERY_RATE_LIMIT: str = os.getenv("QUERY_RATE_LIMIT", "30/minute")
    UPLOAD_RATE_LIMIT: str = os.getenv("UPLOAD_RATE_LIMIT", "10/minute")
    
    # Query
    MAX_QUERY_ROWS: int = 10_000
    QUERY_TIMEOUT: int = 30
    
    # Cache
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    
    # Default table
    DEFAULT_TABLE: str = "youtube_data"
    
    # Frontend URL for CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = Settings()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)