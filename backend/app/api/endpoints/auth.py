import os
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql.schema import Column

# Local imports
from app.db.session import get_db
from app.db.models import User, Otp_Table
from app.schemas.user import SignupRequest, OtpRequest, LoginRequest
from app.core.time_utils import now_utc, to_utc, add_minutes
from app.core.security import create_access_token, get_current_user
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.i18n import t
from datetime import datetime, timedelta
import requests


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


# API_KEY = os.getenv("API_KEY")
def call_otp_api(mobile, message):
    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = f"sender_id=Players-Hub&message='Players Hub'&route=otp&variables_values={message}&numbers={mobile}"
    headers = {
        "authorization": os.getenv("FAST2SMS_API_KEY"),
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
    }
    response = requests.request("POST", url, data=payload, headers=headers)
    return response.json()


@router.post("/signup")
def signup(user: SignupRequest, request: Request, db: Session = Depends(get_db)):
    try:
        logger.info("In signup")
        existing_user = db.query(User).filter(User.mobile == user.mobile).first()
        logger.info(existing_user)

        if existing_user:
            if (
                existing_user.is_deleted is not None
                and existing_user.is_deleted is True
            ):
                setattr(existing_user, "is_deleted", False)
                setattr(existing_user, "name", user.name)
                setattr(existing_user, "referral_code", user.referral_code)
                db.commit()
                db.refresh(existing_user)
                return {
                    "message": t(
                        "auth.user_reactivated",
                        lang=getattr(request.state, "language", "en"),
                    ),
                    "mobile": existing_user.mobile,
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail=t(
                        "auth.user_already_exists",
                        lang=getattr(request.state, "language", "en"),
                    ),
                )

        new_user = User(
            mobile=user.mobile,
            name=user.name,
            referral_code=user.referral_code,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": t(
                "auth.user_registered", lang=getattr(request.state, "language", "en")
            ),
            "mobile": new_user.mobile,
        }
    except HTTPException as e:
        # Re-raise known HTTPExceptions
        raise e
    except Exception as e:
        logger.error("Unexpected error in signup: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=t(
                "auth.something_went_wrong",
                lang=getattr(request.state, "language", "en"),
            ),
        )


@router.post("/send_login_otp")
def send_login_otp(user: OtpRequest, request: Request, db: Session = Depends(get_db)):
    try:
        current_time_utc = now_utc()
        existing_user = (
            db.query(User)
            .filter(User.mobile == user.mobile_number, User.is_deleted.is_(False))
            .first()
        )
        if not existing_user:
            raise HTTPException(
                status_code=404,
                detail=t(
                    "auth.mobile_not_registered",
                    lang=getattr(request.state, "language", "en"),
                ),
            )
        new_otp = 123456
        expire_time = add_minutes(current_time_utc, 5)
        otp_found = (
            db.query(Otp_Table)
            .filter(Otp_Table.mobile_number == user.mobile_number)
            .order_by(Otp_Table.time.desc())
            .first()
        )
        if otp_found is not None and getattr(otp_found, "time", None) is not None:
            otp_time = getattr(otp_found, "time")
            # Assume timestamps are UTC; if naive, treat as UTC
            otp_time = to_utc(otp_time)
            five_min_ago = add_minutes(now_utc(), -5)
            three_min_ago = add_minutes(now_utc(), -3)
            if otp_time >= five_min_ago:
                if otp_time > three_min_ago:
                    raise HTTPException(
                        status_code=400,
                        detail=t(
                            "auth.otp_wait_message",
                            lang=getattr(request.state, "language", "en"),
                        ),
                    )
                if getattr(otp_found, "count", 0) >= 3:
                    raise HTTPException(
                        status_code=400,
                        detail=t(
                            "auth.too_many_otp_attempts",
                            lang=getattr(request.state, "language", "en"),
                        ),
                    )
                # Refresh OTP and timestamp so login uses a fresh validity window
                setattr(otp_found, "count", getattr(otp_found, "count", 0) + 1)
                setattr(otp_found, "otp", new_otp)
                setattr(otp_found, "time", current_time_utc)
                db.commit()
            else:
                setattr(otp_found, "count", 1)
                setattr(otp_found, "otp", new_otp)
                setattr(otp_found, "time", current_time_utc)
                db.commit()
        else:
            if otp_found is not None:
                setattr(otp_found, "count", 1)
                setattr(otp_found, "otp", new_otp)
                setattr(otp_found, "time", current_time_utc)
                db.commit()
            else:
                new_otp_log = Otp_Table(
                    mobile_number=user.mobile_number,
                    time=current_time_utc,
                    count=1,
                    otp=new_otp,
                )
                db.add(new_otp_log)
                db.commit()
                db.refresh(new_otp_log)
        number = user.mobile_number
        message = new_otp
        return {
            "status_code": 200,
            "message": t(
                "auth.otp_sent_success",
                lang=getattr(request.state, "language", "en"),
            ),
            "otp": new_otp,
        }
    except HTTPException as e:
        logger.error("Error: %s", e)
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error("Error: %s", e)
        return JSONResponse(
            status_code=500,
            content={
                "detail": t(
                    "auth.unable_to_send_otp",
                    lang=getattr(request.state, "language", "en"),
                )
            },
        )


@router.post("/login")
def login(user: LoginRequest, request: Request, db: Session = Depends(get_db)):
    try:
        logger.info("In login")
        current_time_utc = now_utc()
        requested_otp = (
            db.query(Otp_Table)
            .filter(Otp_Table.mobile_number == user.mobile)
            .order_by(Otp_Table.time.desc())
            .first()
        )
        if not requested_otp:
            raise HTTPException(
                status_code=404,
                detail="Please request an OTP first before logging in.",
            )
        logger.info(f"requested_otp: {requested_otp}")
        logger.info(f"user: {user}")

        # Normalize OTP types to avoid string/int mismatch
        def _normalize_otp(value):
            try:
                return int(str(value).strip())
            except Exception:
                return None

        stored_otp = _normalize_otp(getattr(requested_otp, "otp", None))
        provided_otp = _normalize_otp(getattr(user, "otp", None))
        logger.info(
            f"stored_otp(normalized): {stored_otp}, provided_otp(normalized): {provided_otp}"
        )

        if (
            requested_otp is not None
            and not isinstance(requested_otp.otp, Column)
            and not isinstance(requested_otp.time, Column)
            and stored_otp is not None
            and provided_otp is not None
            and stored_otp == provided_otp
            and (
                requested_otp.time is not None
                or getattr(requested_otp, "update_date", None) is not None
                or getattr(requested_otp, "create_date", None) is not None
            )
        ):
            # Choose the freshest timestamp available among time, update_date, create_date
            candidate_times = [
                ts
                for ts in [
                    getattr(requested_otp, "time", None),
                    getattr(requested_otp, "update_date", None),
                    getattr(requested_otp, "create_date", None),
                ]
                if ts is not None
            ]
            otp_time = max(candidate_times)
            otp_time = to_utc(otp_time)
            logger.info(
                f"otp_time(utc): {otp_time} | update_date: {getattr(requested_otp, 'update_date', None)} | create_date: {getattr(requested_otp, 'create_date', None)}"
            )
            if add_minutes(otp_time, 5) >= current_time_utc:
                access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={"sub": user.mobile}, expires_delta=access_token_expires
                )
                return {
                    "message": "Login successful!",
                    "mobile": user.mobile,
                    "access_token": access_token,
                }
        raise HTTPException(
            status_code=401,
            detail="Incorrect OTP or OTP has expired. Please try again.",
        )
    except HTTPException as e:
        # Preserve intended HTTP errors (e.g., 401/404) instead of converting to 500
        try:
            # Log meaningful detail if available
            detail = e.detail if isinstance(e.detail, str) else str(e.detail)
        except Exception:
            detail = ""
        logger.error("Login HTTPException: %s", detail)
        raise e
    except Exception as e:
        logger.error("Unexpected error in login: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Unable to process login. Please try again."
        )


@router.post("/logout")
def logout(
    db: Session = Depends(get_db), buyer_mobile: str = Depends(get_current_user)
):

    # access_token = create_access_token(
    #         data={"sub": buyer_mobile}, expires_delta=access_token_expires
    #     )
    # if not access_token:
    #     raise HTTPException(status_code=400, detail="Invalid token or missing token")

    return {"message": "Logged out successfully"}
