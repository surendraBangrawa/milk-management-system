from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.jwt_middleware import JWTMiddleware
from app.api.endpoints import (
    ratelist,
    auth,
    customers,
    transactions,
    profile,
    subscriptions,
    enhanced_auth,
    offline_sync,
)
from app.core.logging_config import configure_logging
from app.db.session import Base, engine
from app.db.models import *

configure_logging()
load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Milk Management System API",
    description="Enhanced API for managing milk rates, collections, with advanced security, offline sync, and webhook integrations",
    version="2.0.0",
    openapi_tags=[
        {"name": "ratelist", "description": "Operations related to milk rate lists"},
        {"name": "auth", "description": "Basic authentication and user management"},
        {
            "name": "enhanced-auth",
            "description": "Enhanced authentication with device management, sessions, and security features",
        },
        {"name": "customers", "description": "Customer management"},
        {"name": "transactions", "description": "Transaction management"},
        {"name": "profile", "description": "User profile management"},
        {"name": "subscriptions", "description": "Subscription management"},
        {
            "name": "offline-sync",
            "description": "Offline synchronization for mobile apps",
        },
    ],
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT middleware
app.add_middleware(JWTMiddleware)

# Include all routers
app.include_router(ratelist.router)
app.include_router(auth.router)
app.include_router(enhanced_auth.router)
app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(profile.router)
app.include_router(subscriptions.router)
app.include_router(offline_sync.router)


@app.get("/")
async def root():
    return {
        "message": "Milk Management System API v2.0",
        "version": "2.0.0",
        "features": [
            "Enhanced Security & Authentication",
            "Device Management",
            "Offline Synchronization",
            "Webhook Integrations",
            "Audit Logging",
            "Rate Limiting",
            "Multi-language Support",
            "Theme Customization",
        ],
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}
