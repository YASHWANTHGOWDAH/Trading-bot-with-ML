import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root or app directory
base_dir = Path(__file__).resolve().parent.parent
dotenv_path = base_dir / ".env"
load_dotenv(dotenv_path=dotenv_path)

class Settings:
    PROJECT_NAME: str = "TradeMind AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # MongoDB (supports MONGODB_URL, MONGODB_URI, MONGO_URL, DATABASE_URL)
    _raw_mongo = (
        os.getenv("MONGODB_URL")
        or os.getenv("MONGODB_URI")
        or os.getenv("MONGO_URL")
        or os.getenv("DATABASE_URL")
        or "mongodb://localhost:27017"
    ).strip().strip("'").strip('"')
    MONGODB_URL: str = _raw_mongo
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "trademind_ai").strip().strip("'").strip('"')
    
    # Security & JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "trademind_ai_super_secret_jwt_key_2026_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Paper Trading Defaults
    INITIAL_VIRTUAL_CAPITAL: float = float(os.getenv("INITIAL_VIRTUAL_CAPITAL", "100000.0"))
    
    # CORS (supports CORS_ORIGINS comma-separated list and FRONTEND_URL)
    raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000")
    _parsed = [origin.strip().rstrip('/') for origin in raw_cors.split(",") if origin.strip()]
    _fe_url = os.getenv("FRONTEND_URL")
    if _fe_url and _fe_url.strip().rstrip('/') not in _parsed:
        _parsed.append(_fe_url.strip().rstrip('/'))
    CORS_ORIGINS: list = _parsed

settings = Settings()
