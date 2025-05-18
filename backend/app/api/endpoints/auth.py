import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, AuthUser
from app.schemas.user import SignupRequest, OtpRequest, LoginRequest
from app.core.config import local_timezone
from app.core.security import create_access_token, get_current_user
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import datetime, timedelta
import logging


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"In signup")
        existing_user = db.query(User).filter(User.mobile == user.mobile).first()
        logger.info(existing_user)

        if existing_user:
            if existing_user.is_deleted == 1:
                existing_user.is_deleted = 0
                existing_user.name = user.name
                existing_user.referral_code = user.referral_code
                db.commit()
                db.refresh(existing_user)
                return {
                    "message": "User reactivated successfully!",
                    "mobile": existing_user.mobile,
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail="User with this mobile number already exists",
                )

        new_user = User(
            mobile=user.mobile,
            name=user.name,
            referral_code=user.referral_code,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"message": "User registered successfully!", "mobile": new_user.mobile}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.post("/send_login_otp")
def send_login_otp(user: OtpRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"In send_login_otp")
        local_time = datetime.now(local_timezone)
        existing_user = (
            db.query(User)
            .filter(User.mobile == user.mobile, User.is_deleted == 0)
            .first()
        )
        if not existing_user:
            raise HTTPException(
                status_code=404,
                detail="User not found, Please check your mobile number or sign up if you don't have an account.",
            )

        new_otp = random.randint(100000, 999999)
        expire_time = local_time + timedelta(minutes=5)

        login_entry = db.query(AuthUser).filter(AuthUser.mobile == user.mobile).first()

        if login_entry:
            login_entry.otp = new_otp
            login_entry.expire_at = expire_time
        else:
            login_entry = AuthUser(
                mobile=user.mobile,
                otp=new_otp,
                expire_at=expire_time,
            )
            db.add(login_entry)

        db.commit()
        db.refresh(login_entry)

        return {"message": "OTP sent successfully!", "mobile": user.mobile}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


@router.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"In login")
        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        requested_otp = (
            db.query(AuthUser).filter(AuthUser.mobile == user.mobile).first()
        )
        if not requested_otp:
            raise HTTPException(
                status_code=404,
                detail="User not found, Please request OTP from registered mobile number.",
            )

        print(requested_otp.expire_at)
        print(local_time)

        if requested_otp.otp == user.otp and requested_otp.expire_at >= local_time:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.mobile}, expires_delta=access_token_expires
            )

            return {
                "message": "User logged in successfully",
                "mobile": user.mobile,
                "access_token": access_token,
            }
        else:
            raise HTTPException(
                status_code=401, detail="Entered OTP is wrong or expired."
            )
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Something went wrong")


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
