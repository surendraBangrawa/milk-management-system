from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from jose import jwt, JWTError, ExpiredSignatureError
from typing import Callable, Optional
from app.db.session import get_db
from app.db.models import User
from app.core.security import SECRET_KEY, ALGORITHM

import logging

logger = logging.getLogger(__name__)


class JWTMiddleware(BaseHTTPMiddleware):
    """
    Middleware to authenticate requests using a JWT token from the Authorization header.
    It decodes the token, fetches the user from the database, and attaches the user
    object to the request state.
    """

    async def dispatch(self, request: Request, call_next: Callable):
        excluded_paths = [
            "/docs",
            "/openapi.json",
            "/auth/token",
            "/auth/login",
            "/auth/signup",
            "/auth/send_login_otp",
            "/subscriptions/razorpay_webhook",  # Webhook endpoint doesn't need JWT auth
            "/subscriptions/webhook-test",  # Webhook test endpoint
            "/subscriptions/debug-subscription",  # Debug endpoint
            "/payment-callback",  # Payment callback doesn't need JWT auth
            "/favicon.ico",  # Browser favicon requests
            "/api/inngest",
        ]
        if request.url.path in excluded_paths or request.url.path.startswith("/static"):
            return await call_next(request)

        token_header = request.headers.get("Authorization")
        if not token_header:
            logger.warning("Authorization header missing for a protected path.")
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "message": "Please log in to access this feature",
                        "error_code": "AUTH_HEADER_MISSING",
                        "requires_logout": False,
                    }
                },
            )

        token_list = token_header.split(" ")
        if len(token_list) != 2 or token_list[0].lower() != "bearer":
            logger.warning("Invalid token format.")
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "message": "Invalid login session. Please sign in again",
                        "error_code": "INVALID_TOKEN_FORMAT",
                        "requires_logout": False,
                    }
                },
            )

        token = token_list[1]
        db: Optional[Session] = None

        try:
            # First decode the JWT token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            mobile: Optional[str] = payload.get("sub")  # Extract user mobile from token

            if not mobile:
                logger.warning("Invalid token: 'sub' field missing.")
                return JSONResponse(
                    status_code=401,
                    content={
                        "detail": {
                            "message": "Invalid login session. Please sign in again",
                            "error_code": "INVALID_TOKEN_CONTENT",
                            "requires_logout": True,
                        }
                    },
                )

            # Get database session
            try:
                db = next(get_db())
            except Exception as db_error:
                logger.error(f"Database session error: {db_error}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "detail": {
                            "message": "Server connection error. Please try again in a moment",
                            "error_code": "DB_CONNECTION_ERROR",
                            "requires_logout": False,
                        }
                    },
                )

            # Query for user
            try:
                user = (
                    db.query(User)
                    .filter(User.mobile == mobile, User.is_deleted == 0)
                    .first()
                )
            except Exception as query_error:
                logger.error(f"Database query error: {query_error}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "detail": {
                            "message": "Server error. Please try again in a moment",
                            "error_code": "DB_QUERY_ERROR",
                            "requires_logout": False,
                        }
                    },
                )

            if not user:
                logger.warning(f"User {mobile} not found or inactive in DB.")
                return JSONResponse(
                    status_code=401,
                    content={
                        "detail": {
                            "message": "Your account is not active or has been removed. Please contact support",
                            "error_code": "USER_NOT_FOUND_OR_INACTIVE",
                            "requires_logout": True,
                        }
                    },
                )

            request.state.user = user
            logger.info(f"Authenticated request for user: {user.mobile}")

        except ExpiredSignatureError:
            logger.warning("Token has expired.")
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "message": "Your session has expired. Please sign in again",
                        "error_code": "TOKEN_EXPIRED",
                        "requires_logout": True,
                    }
                },
            )
        except JWTError:
            logger.warning("Invalid token.")
            return JSONResponse(
                status_code=401,
                content={
                    "detail": {
                        "message": "Invalid login session. Please sign in again",
                        "error_code": "INVALID_TOKEN",
                        "requires_logout": True,
                    }
                },
            )
        except Exception as e:
            logger.error(f"Unexpected error in JWTMiddleware: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "detail": {
                        "message": "An unexpected error occurred. Please try again",
                        "error_code": "AUTH_INTERNAL_ERROR",
                        "requires_logout": False,
                    }
                },
            )
        finally:
            # Always close the database session
            if db is not None:
                try:
                    db.close()
                except Exception as close_error:
                    logger.error(f"Error closing database session: {close_error}")

        response = await call_next(request)
        return response
