import time
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, UserSession, AuditLog, ApiRateLimit, UserDevice
from app.core.config import local_timezone

logger = logging.getLogger(__name__)


class SecurityMiddleware:
    """Enhanced security middleware for authentication, rate limiting, and audit logging"""

    def __init__(self):
        self.rate_limit_window = 3600  # 1 hour
        self.max_requests_per_window = 1000
        self.max_failed_logins = 5
        self.lockout_duration = 1800  # 30 minutes

    async def authenticate_request(
        self, request: Request, db: Session, require_auth: bool = True
    ) -> Optional[str]:
        """Enhanced authentication with device tracking and session management"""
        try:
            # Get authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                if require_auth:
                    raise HTTPException(
                        status_code=401, detail="Invalid authorization header"
                    )
                return None

            token = auth_header.split(" ")[1]

            # Validate token and get user
            user_mobile = await self._validate_token(token, db)
            if not user_mobile:
                raise HTTPException(status_code=401, detail="Invalid or expired token")

            # Check if account is locked
            user = db.query(User).filter(User.mobile == user_mobile).first()
            if (
                user
                and user.account_locked_until
                and user.account_locked_until > datetime.now(local_timezone)
            ):
                raise HTTPException(
                    status_code=423,
                    detail=f"Account locked until {user.account_locked_until.strftime('%Y-%m-%d %H:%M:%S')}",
                )

            # Track session activity
            await self._update_session_activity(token, request, db)

            # Log audit trail
            await self._log_audit_trail(
                user_mobile=user_mobile,
                action="API_ACCESS",
                resource_type="API",
                resource_id=request.url.path,
                request=request,
                db=db,
            )

            return user_mobile

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise HTTPException(status_code=500, detail="Authentication failed")

    async def _validate_token(self, token: str, db: Session) -> Optional[str]:
        """Validate JWT token and return user mobile"""
        try:
            # Import here to avoid circular imports
            from app.core.security import decode_access_token

            payload = decode_access_token(token)
            user_mobile = payload.get("sub")

            if not user_mobile:
                return None

            # Check if session exists and is active
            session = (
                db.query(UserSession)
                .filter(
                    UserSession.session_id == token,
                    UserSession.is_active == True,
                    UserSession.expires_at > datetime.now(local_timezone),
                )
                .first()
            )

            if not session:
                return None

            return user_mobile

        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return None

    async def _update_session_activity(self, token: str, request: Request, db: Session):
        """Update session last activity and device info"""
        try:
            session = (
                db.query(UserSession).filter(UserSession.session_id == token).first()
            )
            if session:
                session.last_activity = datetime.now(local_timezone)

                # Update device info if available
                device_id = request.headers.get("X-Device-ID")
                if device_id:
                    device = (
                        db.query(UserDevice)
                        .filter(
                            UserDevice.user_mobile == session.user_mobile,
                            UserDevice.device_id == device_id,
                        )
                        .first()
                    )
                    if device:
                        device.last_used = datetime.now(local_timezone)

                db.commit()

        except Exception as e:
            logger.error(f"Session update error: {e}")

    async def check_rate_limit(
        self, request: Request, user_mobile: Optional[str], db: Session
    ) -> bool:
        """Check and enforce rate limiting"""
        try:
            ip_address = self._get_client_ip(request)
            endpoint = request.url.path

            # Clean old rate limit records
            cutoff_time = datetime.now(local_timezone) - timedelta(
                seconds=self.rate_limit_window
            )
            db.query(ApiRateLimit).filter(
                ApiRateLimit.window_start < cutoff_time
            ).delete()

            # Check existing rate limit
            rate_limit = (
                db.query(ApiRateLimit)
                .filter(
                    ApiRateLimit.ip_address == ip_address,
                    ApiRateLimit.endpoint == endpoint,
                    ApiRateLimit.window_start >= cutoff_time,
                )
                .first()
            )

            if rate_limit:
                if rate_limit.request_count >= self.max_requests_per_window:
                    logger.warning(
                        f"Rate limit exceeded for IP: {ip_address}, endpoint: {endpoint}"
                    )
                    return False
                rate_limit.request_count += 1
            else:
                rate_limit = ApiRateLimit(
                    user_mobile=user_mobile,
                    ip_address=ip_address,
                    endpoint=endpoint,
                    request_count=1,
                    window_start=datetime.now(local_timezone),
                )
                db.add(rate_limit)

            db.commit()
            return True

        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return True  # Allow request if rate limiting fails

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address considering proxies"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def log_failed_login(self, mobile: str, request: Request, db: Session):
        """Log failed login attempt and potentially lock account"""
        try:
            user = db.query(User).filter(User.mobile == mobile).first()
            if user:
                user.failed_login_attempts += 1

                # Lock account if too many failed attempts
                if user.failed_login_attempts >= self.max_failed_logins:
                    user.account_locked_until = datetime.now(
                        local_timezone
                    ) + timedelta(seconds=self.lockout_duration)
                    logger.warning(f"Account locked for user: {mobile}")

                db.commit()

            # Log audit trail
            await self._log_audit_trail(
                user_mobile=mobile,
                action="LOGIN_FAILED",
                resource_type="AUTH",
                resource_id=mobile,
                request=request,
                db=db,
            )

        except Exception as e:
            logger.error(f"Failed login logging error: {e}")

    async def reset_failed_logins(self, mobile: str, db: Session):
        """Reset failed login attempts on successful login"""
        try:
            user = db.query(User).filter(User.mobile == mobile).first()
            if user:
                user.failed_login_attempts = 0
                user.account_locked_until = None
                user.last_login = datetime.now(local_timezone)
                db.commit()

        except Exception as e:
            logger.error(f"Reset failed logins error: {e}")

    async def _log_audit_trail(
        self,
        user_mobile: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str],
        request: Request,
        db: Session,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
    ):
        """Log audit trail for compliance"""
        try:
            audit_log = AuditLog(
                user_mobile=user_mobile,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                old_values=old_values,
                new_values=new_values,
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get("User-Agent"),
                session_id=(
                    request.headers.get("Authorization", "").split(" ")[1]
                    if request.headers.get("Authorization")
                    else None
                ),
            )

            db.add(audit_log)
            db.commit()

        except Exception as e:
            logger.error(f"Audit logging error: {e}")

    async def register_device(
        self,
        user_mobile: str,
        device_info: Dict[str, Any],
        request: Request,
        db: Session,
    ) -> str:
        """Register a new device for the user"""
        try:
            device_id = device_info.get("device_id")
            if not device_id:
                raise ValueError("Device ID is required")

            # Check if device already exists
            existing_device = (
                db.query(UserDevice)
                .filter(
                    UserDevice.user_mobile == user_mobile,
                    UserDevice.device_id == device_id,
                )
                .first()
            )

            if existing_device:
                # Update existing device info
                existing_device.device_name = device_info.get("device_name")
                existing_device.os_info = device_info.get("os_info")
                existing_device.app_version = device_info.get("app_version")
                existing_device.last_used = datetime.now(local_timezone)
                db.commit()
                return device_id

            # Create new device
            new_device = UserDevice(
                user_mobile=user_mobile,
                device_id=device_id,
                device_name=device_info.get("device_name"),
                device_type=device_info.get("device_type"),
                os_info=device_info.get("os_info"),
                app_version=device_info.get("app_version"),
                is_trusted=False,  # Require explicit trust
            )

            db.add(new_device)
            db.commit()

            # Log device registration
            await self._log_audit_trail(
                user_mobile=user_mobile,
                action="DEVICE_REGISTERED",
                resource_type="DEVICE",
                resource_id=device_id,
                request=request,
                db=db,
                new_values=device_info,
            )

            return device_id

        except Exception as e:
            logger.error(f"Device registration error: {e}")
            raise HTTPException(status_code=400, detail="Device registration failed")


# Global security middleware instance
security_middleware = SecurityMiddleware()


# Dependency for enhanced authentication
async def get_current_user_enhanced(
    request: Request, db: Session = Depends(get_db)
) -> str:
    """Enhanced authentication dependency with rate limiting and audit logging"""
    user_mobile = await security_middleware.authenticate_request(request, db)

    # Check rate limiting
    if not await security_middleware.check_rate_limit(request, user_mobile, db):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    return user_mobile


# Dependency for optional authentication (for public endpoints)
async def get_current_user_optional(
    request: Request, db: Session = Depends(get_db)
) -> Optional[str]:
    """Optional authentication dependency"""
    return await security_middleware.authenticate_request(
        request, db, require_auth=False
    )
