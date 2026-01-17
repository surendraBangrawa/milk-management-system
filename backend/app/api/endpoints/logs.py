"""
Frontend Logging Endpoint
Receives logs from frontend applications and writes them to the central log file.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging
import json

router = APIRouter(
    prefix="/logs",
    tags=["logs"],
)

logger = logging.getLogger(__name__)


class FrontendLogEntry(BaseModel):
    timestamp: str
    level: str
    message: str
    service: str = "frontend"
    platform: Optional[str] = None
    appVersion: Optional[str] = None
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    metadata: Optional[dict] = None
    error: Optional[dict] = None


class FrontendLogsRequest(BaseModel):
    logs: List[FrontendLogEntry]


@router.post("/frontend")
async def receive_frontend_logs(
    request_data: FrontendLogsRequest,
    request: Request,
):
    """
    Receive logs from frontend applications and write them to central log file.
    This endpoint is public (no auth required) to allow logging even when user is not authenticated.
    """
    try:
        # Process each log entry
        for log_entry in request_data.logs:
            # Prepare extra fields for JSON logging (for Grafana/Loki)
            extra_fields = {
                "service": log_entry.service,
                "platform": log_entry.platform,
                "appVersion": log_entry.appVersion,
                "userId": log_entry.userId,
                "sessionId": log_entry.sessionId,
            }

            # Add metadata if present
            if log_entry.metadata:
                extra_fields["metadata"] = log_entry.metadata

            # Add error details if present
            if log_entry.error:
                extra_fields["error"] = {
                    "name": log_entry.error.get("name"),
                    "message": log_entry.error.get("message"),
                    "stack": (
                        log_entry.error.get("stack", "")[:500]
                        if log_entry.error.get("stack")
                        else None
                    ),
                }

            # Log using appropriate level with extra fields for JSON format
            log_level = log_entry.level.upper()

            # Create a LogRecord with extra fields for JSON formatting
            if log_level == "DEBUG":
                logger.debug(log_entry.message, extra={"extra_fields": extra_fields})
            elif log_level == "INFO":
                logger.info(log_entry.message, extra={"extra_fields": extra_fields})
            elif log_level == "WARNING":
                logger.warning(log_entry.message, extra={"extra_fields": extra_fields})
            elif log_level == "ERROR":
                logger.error(log_entry.message, extra={"extra_fields": extra_fields})
            elif log_level == "CRITICAL":
                logger.critical(log_entry.message, extra={"extra_fields": extra_fields})
            else:
                logger.info(
                    log_entry.message, extra={"extra_fields": extra_fields}
                )  # Default to info

        return {
            "status": "success",
            "logs_received": len(request_data.logs),
            "message": "Logs received and written successfully",
        }

    except Exception as e:
        # Log the error but don't fail the request (logging should never break the app)
        logger.error(f"Error processing frontend logs: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Logs received but processing failed",
            "error": str(e),
        }
