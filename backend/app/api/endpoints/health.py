from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
import redis
import os
import sys
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "services": {},
    }

    # # Check database connection
    # try:
    #     db = next(get_db())
    #     db.execute("SELECT 1")
    #     health_status["services"]["database"] = "healthy"
    # except Exception as e:
    #     health_status["services"]["database"] = f"unhealthy: {str(e)}"
    #     health_status["status"] = "unhealthy"

    # Check Redis connection
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(redis_url)
        r.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"

    # Check if any service is unhealthy
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)

    return health_status


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with more information
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "services": {},
        "system": {
            "python_version": sys.version,
            "platform": sys.platform,
        },
    }

    # Database detailed check
    try:
        db = next(get_db())
        result = db.execute("SELECT VERSION() as version").fetchone()
        health_status["services"]["database"] = {
            "status": "healthy",
            "version": result[0] if result else "unknown",
        }
    except Exception as e:
        health_status["services"]["database"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "unhealthy"

    # Redis detailed check
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(redis_url)
        info = r.info()
        health_status["services"]["redis"] = {
            "status": "healthy",
            "version": info.get("redis_version", "unknown"),
            "used_memory": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
        }
    except Exception as e:
        health_status["services"]["redis"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "unhealthy"

    # Check environment variables
    required_env_vars = [
        "DATABASE_URL",
        "JWT_SECRET_KEY",
        "RAZORPAY_KEY_ID",
        "RAZORPAY_SECRET_KEY",
    ]

    health_status["environment_variables"] = {}
    for var in required_env_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if "SECRET" in var or "KEY" in var:
                health_status["environment_variables"][var] = (
                    "***" + value[-4:] if len(value) > 4 else "***"
                )
            else:
                health_status["environment_variables"][var] = "set"
        else:
            health_status["environment_variables"][var] = "missing"
            health_status["status"] = "unhealthy"

    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)

    return health_status
