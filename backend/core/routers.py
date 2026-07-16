from fastapi import APIRouter
from src.auth.routes import router as auth_router
from src.query.routes import router as query_router
from src.database.routes import router as database_router

api_router = APIRouter()

# Include all module routers here
api_router.include_router(auth_router, prefix="/api/auth", tags=["auth"])
api_router.include_router(query_router, prefix="/api/query", tags=["query"])
api_router.include_router(database_router, prefix="/api/database", tags=["database"])

