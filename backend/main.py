from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.jwt_middleware import JWTMiddleware

# from app.api.endpoints import (
#     ratelist,
#     auth,
#     customers,
#     transactions,
#     profile,
#     subscriptions,
#     enhanced_auth,
#     offline_sync,
# )
from app.api.endpoints.health import router as health_router
from app.api.endpoints.ratelist import router as ratelist_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.customers import router as customers_router
from app.api.endpoints.transactions import router as transactions_router
from app.api.endpoints.profile import router as profile_router
from app.api.endpoints.subscriptions import router as subscriptions_router
from app.api.endpoints.offline_sync import router as offline_sync_router
from app.api.endpoints.enhanced_auth import router as enhanced_auth_router
from app.core.logging_config import configure_logging
from app.db.session import Base, engine
from app.core.config import settings
import uvicorn

configure_logging()
load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Milk Management System API",
    description="Enhanced API for managing milk rates, collections, with advanced security, offline sync, and webhook integrations",
    version="2.0.0",
    openapi_tags=[
        {"name": "health", "description": "Health check and monitoring"},
    ],
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT middleware
app.add_middleware(JWTMiddleware)

# Only include health router
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(ratelist_router)
app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(transactions_router)
app.include_router(profile_router)
app.include_router(subscriptions_router)
app.include_router(offline_sync_router)
app.include_router(enhanced_auth_router)


@app.get("/")
async def root():
    return {
        "message": "Milk Management System API v2.0",
        "version": "2.0.0",
        "features": [
            "Health Check Only (Debug Mode)",
        ],
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
