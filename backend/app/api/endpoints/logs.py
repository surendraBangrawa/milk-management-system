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
            # Format log message similar to backend logs
            log_message = log_entry.message
            
            # Add context information
            context_parts = []
            if log_entry.userId:
                context_parts.append(f"user={log_entry.userId}")
            if log_entry.sessionId:
                context_parts.append(f"session={log_entry.sessionId}")
            if log_entry.platform:
                context_parts.append(f"platform={log_entry.platform}")
            if log_entry.appVersion:
                context_parts.append(f"version={log_entry.appVersion}")
            
            context_str = f" [{', '.join(context_parts)}]" if context_parts else ""
            
            # Add metadata if present
            metadata_str = ""
            if log_entry.metadata:
                metadata_str = f" | metadata={json.dumps(log_entry.metadata)}"
            
            # Add error details if present
            error_str = ""
            if log_entry.error:
                error_str = f" | error={log_entry.error.get('name', 'Unknown')}: {log_entry.error.get('message', '')}"
                if log_entry.error.get('stack'):
                    error_str += f" | stack={log_entry.error.get('stack')[:200]}"
            
            # Construct full log message
            full_message = f"{log_message}{context_str}{metadata_str}{error_str}"
            
            # Log using appropriate level
            log_level = log_entry.level.upper()
            if log_level == "DEBUG":
                logger.debug(full_message)
            elif log_level == "INFO":
                logger.info(full_message)
            elif log_level == "WARNING":
                logger.warning(full_message)
            elif log_level == "ERROR":
                logger.error(full_message)
            elif log_level == "CRITICAL":
                logger.critical(full_message)
            else:
                logger.info(full_message)  # Default to info
        
        return {
            "status": "success",
            "logs_received": len(request_data.logs),
            "message": "Logs received and written successfully"
        }
    
    except Exception as e:
        # Log the error but don't fail the request (logging should never break the app)
        logger.error(f"Error processing frontend logs: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Logs received but processing failed",
            "error": str(e)
        }

