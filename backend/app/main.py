import sys
import logging
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, db_instance
from app.routes import auth, market, ai, paper, portfolio, backtest, watchlist, alerts, chat

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trademind.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and create indexes
    logger.info("Starting up TradeMind AI Backend...")
    await connect_to_mongo()
    yield
    # Shutdown: Close connection
    logger.info("Shutting down TradeMind AI Backend...")
    await close_mongo_connection()

app = FastAPI(
    title="TradeMind AI - Explainable ML Market Analytics & Paper Trading Platform",
    description="Final Year Major Project: Explainable Machine Learning-Based Real-Time Market Analytics and Paper Trading Platform",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration for React/Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(market.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(paper.router, prefix=settings.API_V1_STR)
app.include_router(portfolio.router, prefix=settings.API_V1_STR)
app.include_router(backtest.router, prefix=settings.API_V1_STR)
app.include_router(watchlist.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "project": "TradeMind AI",
        "description": "Explainable Machine Learning-Based Real-Time Market Analytics and Paper Trading Platform",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "status": "online"
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    mongo_status = "connected" if db_instance.client else "disconnected"
    try:
        await db_instance.client.admin.command('ping')
        mongo_ping = "healthy"
    except Exception as e:
        mongo_ping = f"error: {str(e)}"
        
    return {
        "status": "healthy",
        "database": {
            "type": "MongoDB",
            "name": settings.DATABASE_NAME,
            "status": mongo_status,
            "ping": mongo_ping
        },
        "model": "RandomForestClassifier",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
