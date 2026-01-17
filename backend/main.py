from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.jwt_middleware import JWTMiddleware
from app.middleware.i18n_middleware import I18nMiddleware
from app.api.endpoints import (
    ratelist,
    auth,
    customers,
    transactions,
    profile,
    subscriptions,
    i18n,
    ocr_debug,
    logs,
)
import os
from app.core.central_logger import setup_central_logging
from app.db.session import Base, engine
from app.db.models import *
from app.db.init_db import seed_subscription_plans
from app.core.i18n import t, get_translations
import logging

# Setup central logging BEFORE any other imports that might log
load_dotenv()
log_level = os.getenv("LOG_LEVEL", "INFO")
# Auto-detects environment: dev = console + Grafana, prod = Grafana only
setup_central_logging(
    service_name="backend",
    use_json=True,  # Always JSON for Grafana/Loki
    log_level=log_level,
    also_console=None,  # Auto-detect based on environment
)

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

try:
    seed_subscription_plans()
except Exception as e:
    logger.error(f"Failed to seed subscription plans: {e}")

app = FastAPI(
    title="Milk Management System API",
    description="API for managing milk rates, collections, etc.",
    version="0.1.0",
    openapi_tags=[
        {"name": "ratelist", "description": "Operations related to milk rate lists"},
        {"name": "auth", "description": "Authentication and user management"},
        {"name": "customers", "description": "Customer management"},
        {"name": "transactions", "description": "Transaction management"},
        {"name": "profile", "description": "User profile management"},
        {"name": "subscriptions", "description": "Subscription management"},
    ],
)


# Custom exception handler for structured errors
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Log all HTTP exceptions including 404s for debugging
    logger.warning(
        f"HTTP {exc.status_code}: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
            "detail": str(exc.detail),
            "query_params": dict(request.query_params),
        }
    )
    
    # Check if the detail is a structured error (dict with error_code)
    if isinstance(exc.detail, dict) and "error_code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    else:
        # Handle regular HTTPExceptions
        return JSONResponse(
            status_code=exc.status_code, content={"detail": str(exc.detail)}
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(I18nMiddleware)
app.add_middleware(JWTMiddleware)
app.include_router(ratelist.router)
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(profile.router)
app.include_router(subscriptions.router)
app.include_router(i18n.router)
app.include_router(ocr_debug.router, prefix="/debug", tags=["debug"])
app.include_router(logs.router)
