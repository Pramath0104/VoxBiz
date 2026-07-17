import os

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load environment variables before any application imports
load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request

# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from prometheus_fastapi_instrumentator import Instrumentator
# pyrefly: ignore [missing-import]
from slowapi import _rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded
# pyrefly: ignore [missing-import]
from slowapi.middleware import SlowAPIMiddleware

from core.db_connection import close_mongo_connection, connect_to_mongo, get_db
from core.limiter import limiter
from core.logger import logger
from core.middleware.request_context import RequestContextMiddleware
from core.routers import api_router



# Define lifespan event for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    logger.info("Application startup: Connected to MongoDB")
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()
    logger.info("Application shutdown: Disconnected from MongoDB")

app = FastAPI(title="VoxBiz AI Backend", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add Middlewares (order matters: executed bottom-up for incoming, top-down for outgoing)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(RequestContextMiddleware)

# Setup Prometheus Metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Read ALLOWED_ORIGINS from env (comma-separated). Default to localhost for dev.
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

# In production, prevent wildcard
if os.getenv("ENVIRONMENT") == "production" and "*" in origins:
    origins.remove("*")

# Allow CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to VoxBiz API"}

# Include API Routers
app.include_router(api_router)

@app.get("/api/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    """
    Readiness Check: Verifies if the backend and the database are ready to accept traffic.
    """
    try:
        # Ping the database to check if it's reachable
        database = get_db()
        if database is None:
            raise Exception("Database connection not initialized")
        await database.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        # Returning 503 Service Unavailable if database is down
        # pyrefly: ignore [missing-import]
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content={"status": "error", "database": "disconnected"})

