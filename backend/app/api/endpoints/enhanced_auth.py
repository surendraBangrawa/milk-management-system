import logging
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import User, UserSession, UserDevice, Otp_Table
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, local_timezone
from app.middleware.security_middleware import security_middleware

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/enhanced-auth",
    tags=["enhanced-auth"],
)


# Pydantic models for enhanced auth
class DeviceInfo(BaseModel):
    device_id: str
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    os_info: Optional[str] = None
    app_version: Optional[str] = None


class EnhancedLoginRequest(BaseModel):
    mobile: str
    otp: str
    device_info: Optional[DeviceInfo] = None


class TwoFactorSetupRequest(BaseModel):
    mobile: str
    enable_2fa: bool


class TrustDeviceRequest(BaseModel):
    device_id: str
    trust: bool


class SessionInfo(BaseModel):
    session_id: str
    device_name: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    last_activity: datetime
    expires_at: datetime


@router.post("/login")
async def enhanced_login(
    request: Request,
    login_data: EnhancedLoginRequest,
    db: Session = Depends(get_db)
):
    """Enhanced login with device management and session tracking"""
    try:
        # Verify OTP
        otp_record = db.query(Otp_Table).filter(
            Otp_Table.mobile_number == login_data.mobile,
            Otp_Table.otp == login_data.otp,
            Otp_Table.time > datetime.now(local_timezone) - timedelta(minutes=10)
        ).first()

        if not otp_record:
            await security_middleware.log_failed_login(login_data.mobile, request, db)
            raise HTTPException(status_code=401, detail="Invalid OTP")

        # Get or create user
        user = db.query(User).filter(User.mobile == login_data.mobile).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if account is locked
        if user.account_locked_until and user.account_locked_until > datetime.now(local_timezone):
            raise HTTPException(
                status_code=423,
                detail=f"Account locked until {user.account_locked_until.strftime('%Y-%m-%d %H:%M:%S')}"
            )

        # Reset failed login attempts
        await security_middleware.reset_failed_logins(login_data.mobile, db)

        # Register device if provided
        device_id = None
        if login_data.device_info:
            device_id = await security_middleware.register_device(
                login_data.mobile, 
                login_data.device_info.dict(), 
                request, 
                db
            )

        # Create access token
        access_token = create_access_token(data={"sub": login_data.mobile})
        expires_at = datetime.now(local_timezone) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        # Create session record
        session = UserSession(
            session_id=access_token,
            user_mobile=login_data.mobile,
            device_id=device_id,
            device_name=login_data.device_info.device_name if login_data.device_info else None,
            ip_address=security_middleware._get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            expires_at=expires_at
        )
        db.add(session)
        db.commit()

        # Log successful login
        await security_middleware._log_audit_trail(
            user_mobile=login_data.mobile,
            action="LOGIN_SUCCESS",
            resource_type="AUTH",
            resource_id=login_data.mobile,
            request=request,
            db=db
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_at": expires_at.isoformat(),
            "user": {
                "mobile": user.mobile,
                "name": user.name,
                "two_factor_enabled": user.two_factor_enabled,
                "preferred_language": user.preferred_language,
                "theme_preference": user.theme_preference
            },
            "device_id": device_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enhanced login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/logout")
async def enhanced_logout(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request)
):
    """Enhanced logout with session cleanup"""
    try:
        token = request.headers.get("Authorization", "").split(" ")[1]
        
        # Deactivate session
        session = db.query(UserSession).filter(UserSession.session_id == token).first()
        if session:
            session.is_active = False
            db.commit()

        # Log logout
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="LOGOUT",
            resource_type="AUTH",
            resource_id=user_mobile,
            request=request,
            db=db
        )

        return {"message": "Logged out successfully"}

    except Exception as e:
        logger.error(f"Enhanced logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")


@router.get("/sessions")
async def get_user_sessions(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request)
):
    """Get all active sessions for the user"""
    try:
        sessions = db.query(UserSession).filter(
            UserSession.user_mobile == user_mobile,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.now(local_timezone)
        ).all()

        session_list = []
        for session in sessions:
            session_list.append(SessionInfo(
                session_id=session.session_id,
                device_name=session.device_name,
                ip_address=session.ip_address,
                created_at=session.created_at,
                last_activity=session.last_activity,
                expires_at=session.expires_at
            ))

        return {"sessions": session_list}

    except Exception as e:
        logger.error(f"Get sessions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sessions")


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request)
):
    """Revoke a specific session"""
    try:
        session = db.query(UserSession).filter(
            UserSession.session_id == session_id,
            UserSession.user_mobile == user_mobile
        ).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        session.is_active = False
        db.commit()

        # Log session revocation
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="SESSION_REVOKED",
            resource_type="SESSION",
            resource_id=session_id,
            request=request,
            db=db
        )

        return {"message": "Session revoked successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revoke session error: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke session")


@router.get("/devices")
async def get_user_devices(
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request)
):
    """Get all devices registered for the user"""
    try:
        devices = db.query(UserDevice).filter(
            UserDevice.user_mobile == user_mobile
        ).all()

        device_list = []
        for device in devices:
            device_list.append({
                "id": device.id,
                "device_id": device.device_id,
                "device_name": device.device_name,
                "device_type": device.device_type,
                "os_info": device.os_info,
                "app_version": device.app_version,
                "is_trusted": device.is_trusted,
                "last_used": device.last_used,
                "created_at": device.created_at
            })

        return {"devices": device_list}

    except Exception as e:
        logger.error(f"Get devices error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get devices")


@router.put("/devices/trust")
async def trust_device(
    trust_data: TrustDeviceRequest,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request)
):
    """Trust or untrust a device"""
    try:
        device = db.query(UserDevice).filter(
            UserDevice.user_mobile == user_mobile,
            UserDevice.device_id == trust_data.device_id
        ).first()

        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        device.is_trusted = trust_data.trust
        db.commit()

        # Log device trust change
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="DEVICE_TRUST_CHANGED",
            resource_type="DEVICE",
            resource_id=trust_data.device_id,
            request=request,
            db=db,
            old_values={"is_trusted": not trust_data.trust},
            new_values={"is_trusted": trust_data.trust}
        )

        return {"message": f"Device {'trusted' if trust_data.trust else 'untrusted'} successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trust device error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update device trust")


@router.delete("/devices/{device_id}")
async def remove_device(
    device_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request)
):
    """Remove a device"""
    try:
        device = db.query(UserDevice).filter(
            UserDevice.user_mobile == user_mobile,
            UserDevice.device_id == device_id
        ).first()

        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        # Revoke all sessions for this device
        db.query(UserSession).filter(
            UserSession.user_mobile == user_mobile,
            UserSession.device_id == device_id
        ).update({"is_active": False})

        # Remove device
        db.delete(device)
        db.commit()

        # Log device removal
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="DEVICE_REMOVED",
            resource_type="DEVICE",
            resource_id=device_id,
            request=request,
            db=db
        )

        return {"message": "Device removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Remove device error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove device")


@router.put("/profile/preferences")
async def update_user_preferences(
    preferences: Dict[str, Any] = Body(...),
    request: Request,
    db: Session = Depends(get_db),
    user_mobile: str = Depends(security_middleware.authenticate_request)
):
    """Update user preferences (language, theme, etc.)"""
    try:
        user = db.query(User).filter(User.mobile == user_mobile).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Store old values for audit
        old_values = {
            "preferred_language": user.preferred_language,
            "theme_preference": user.theme_preference
        }

        # Update preferences
        if "preferred_language" in preferences:
            user.preferred_language = preferences["preferred_language"]
        if "theme_preference" in preferences:
            user.theme_preference = preferences["theme_preference"]

        db.commit()

        # Log preference change
        await security_middleware._log_audit_trail(
            user_mobile=user_mobile,
            action="PREFERENCES_UPDATED",
            resource_type="USER",
            resource_id=user_mobile,
            request=request,
            db=db,
            old_values=old_values,
            new_values=preferences
        )

        return {
            "message": "Preferences updated successfully",
            "preferences": {
                "preferred_language": user.preferred_language,
                "theme_preference": user.theme_preference
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update preferences error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update preferences") 