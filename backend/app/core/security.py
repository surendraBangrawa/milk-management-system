from fastapi import Depends, HTTPException, Security
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.config import SECRET_KEY, ALGORITHM
from app.db.session import get_db
from app.db.models import User


oauth2_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(oauth2_scheme),
    db: Session = Depends(get_db),
) -> str:
    """
    Dependency to get the current authenticated user's mobile number.
    Raises HTTPException if authentication fails.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=401,
        detail={
            "message": "Invalid login session. Please sign in again",
            "error_code": "INVALID_AUTH_CREDENTIALS",
            "requires_logout": True,
        },
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        mobile = payload.get("sub")
        if not mobile or not isinstance(mobile, str):
            raise HTTPException(
                status_code=401,
                detail={
                    "message": "Invalid login session. Please sign in again",
                    "error_code": "INVALID_TOKEN_CONTENT",
                    "requires_logout": True,
                },
            )

        user = (
            db.query(User)
            .filter(User.mobile == mobile, User.is_deleted.is_(False))
            .first()
        )
        if not user:
            raise HTTPException(
                status_code=401,
                detail={
                    "message": "Your account is not active or has been removed. Please contact support",
                    "error_code": "USER_NOT_FOUND_OR_INACTIVE",
                    "requires_logout": True,
                },
            )

        return mobile

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Your session has expired. Please sign in again",
                "error_code": "TOKEN_EXPIRED",
                "requires_logout": True,
            },
        )
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Invalid login session. Please sign in again",
                "error_code": "INVALID_TOKEN",
                "requires_logout": True,
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "An unexpected error occurred. Please try again",
                "error_code": "AUTH_INTERNAL_ERROR",
                "requires_logout": False,
            },
        )


def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
