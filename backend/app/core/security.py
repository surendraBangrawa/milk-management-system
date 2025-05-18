from fastapi import Depends, HTTPException, Security
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
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        mobile: str = payload.get("sub")

        if not mobile:
            raise credentials_exception

        user = (
            db.query(User).filter(User.mobile == mobile, User.is_deleted == 0).first()
        )
        if not user:
            raise credentials_exception

        return mobile

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError as e:
        raise credentials_exception
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Internal server error during authentication"
        )


def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
