import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Otp_Table  # , Authuser
from app.schemas.user import SignupRequest, OtpRequest, LoginRequest
from app.core.config import local_timezone
from app.core.security import create_access_token, get_current_user
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.i18n import t
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
import logging
import os
import requests


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


# API_KEY = os.getenv("API_KEY")
def call_otp_api(mobile, message):
    url = "https://www.fast2sms.com/dev/bulkV2"
    print("here1")
    payload = f"sender_id=Players-Hub&message='Players Hub'&route=otp&variables_values={message}&numbers={mobile}"
    headers = {
        "authorization": os.getenv("FAST2SMS_API_KEY"),
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
    }
    print("here2")
    response = requests.request("POST", url, data=payload, headers=headers)
    print(f"response : {response}")
    return response.json()


@router.post("/signup")
def signup(user: SignupRequest, request: Request, db: Session = Depends(get_db)):
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
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(
            status_code=404,
            detail=t(
                "auth.something_went_wrong",
                lang=getattr(request.state, "language", "en"),
            ),
        )


@router.post("/send_login_otp")
def send_login_otp(user: OtpRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"In send_login_otp")
        local_time = datetime.now(local_timezone)
        print("Hello_pre")
        existing_user = (
            db.query(User)
            .filter(User.mobile == user.mobile_number, User.is_deleted == 0)
            .first()
        )
        print("Hello")
        if not existing_user:
            raise HTTPException(
                status_code=404,
                detail="Mobile number not registered. Please sign up first.",
            )
        print("Hello2")
        new_otp = 123456
        expire_time = local_time + timedelta(minutes=5)
        print("Hello3")
        # login_entry = db.query(otp_Table).filter(otp_Table.mobile == user.mobile).first()
        # print(OtpRequest.mobile_number)
        otp_found = (
            db.query(Otp_Table)
            .filter(Otp_Table.mobile_number == user.mobile_number)
            .first()
        )
        print("Hello4")
        if otp_found:
            # Convert otp_found.time to a timezone-aware datetime if it's naive
            if otp_found.time.tzinfo is None:
                otp_found.time = local_timezone.localize(otp_found.time)
        print("Hello5")
        if otp_found:
            if otp_found.time >= (datetime.now(local_timezone) - timedelta(minutes=5)):
                if otp_found.time > (
                    datetime.now(local_timezone) - timedelta(minutes=3)
                ):
                    raise HTTPException(
                        status_code=400,
                        detail="Please wait 3 minutes before requesting another OTP",
                    )
                if otp_found.count >= 3:
                    raise HTTPException(
                        status_code=400,
                        detail="Too many OTP attempts. Please try again after 60 minutes.",
                    )

                otp_found.count = otp_found.count + 1
                otp_found.otp = new_otp
                db.commit()
            else:
                otp_found.count = 1
                otp_found.otp = new_otp
                otp_found.time = datetime.now(local_timezone)

                db.commit()
        else:
            new_otp_log = Otp_Table(
                mobile_number=user.mobile_number,
                time=datetime.now(local_timezone),
                count=1,
                otp=new_otp,
            )

            db.add(new_otp_log)
            db.commit()
            db.refresh(new_otp_log)

        number = user.mobile_number
        message = new_otp
        # response = call_otp_api(number,message)
        # if response.get("status_code") != 200:
        #     raise HTTPException(status_code=400, detail = "Try Again after 30 minutes")
        return {
            "status_code": 200,
            "message": "OTP sent successfully to your mobile number.",
            "otp": new_otp,
        }
        # if login_entry:
        #     login_entry.otp = new_otp
        #     login_entry.expire_at = expire_time
        # else:
        #     login_entry = AuthUser(
        #         mobile=user.mobile,
        #         otp=new_otp,
        #         expire_at=expire_time,
        #     )
        #     db.add(login_entry)

        # db.commit()
        # db.refresh(login_entry)

        # return {"message": "OTP sent successfully!", "mobile": user.mobile}
    except HTTPException as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(str(e))
        return JSONResponse(
            status_code=500,
            content={"detail": "Unable to send OTP. Please try again later."},
        )


@router.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"In login")
        local_time = datetime.now(local_timezone).replace(tzinfo=None)
        requested_otp = (
            db.query(Otp_Table).filter(Otp_Table.mobile_number == user.mobile).first()
        )
        if not requested_otp:
            raise HTTPException(
                status_code=404,
                detail="Please request an OTP first before logging in.",
            )

        # print(requested_otp.expire_at)
        # print(local_time)

        if (
            requested_otp.otp == user.otp
            and (requested_otp.time + timedelta(minutes=5)) >= local_time
        ):
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.mobile}, expires_delta=access_token_expires
            )

            return {
                "message": "Login successful!",
                "mobile": user.mobile,
                "access_token": access_token,
            }
        else:
            raise HTTPException(
                status_code=401,
                detail="Incorrect OTP or OTP has expired. Please try again.",
            )
    except Exception as e:
        logger.error(f"Error: {e}")
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
