from fastapi import Request, HTTPException, Depends, Security
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt
from datetime import datetime
from typing import Callable
from sqlalchemy.orm import Session
from backend.database import get_db, User
#from fastapi.security import OAuth2PasswordBearer

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
oauth2_scheme = HTTPBearer()  # Use direct Bearer Token authentication


#oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "thisisthebestsecretkeythekey"
ALGORITHM = "HS256"

class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        token_header = request.headers.get("Authorization")
        if not token_header:
            raise HTTPException(status_code=401, detail="Authorization header missing")

        token_list = token_header.split(" ")
        if len(token_list) != 2 or token_list[0] != "Bearer":
            raise HTTPException(status_code=401, detail="Invalid token format")

        try:
            # Decode the JWT token
            token_data = jwt.decode(token_list[1], SECRET_KEY, algorithms=[ALGORITHM])
            mobile = token_data.get("sub")  # Extract user mobile from token

            if not mobile:
                raise HTTPException(status_code=401, detail="Invalid token, no user information")

            # ✅ Create a new DB session for this request
            db: Session = next(get_db())

            # ✅ Retrieve user from database
            user = db.query(User).filter(User.mobile == mobile, User.is_deleted ==0).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found or inactive")

            # ✅ Attach user to request state
            request.state.user = user

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

        response = await call_next(request)
        return response


# Function to get the current authenticated user
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(oauth2_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials  # ✅ Extract actual token

    #print(f"Received Token: {token}")  # Debugging output

    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        #print(f"Decoded Payload: {payload}")  # Debugging output

        mobile: str = payload.get("sub")  # Extract mobile number from token

        if not mobile:
            print("Token does not contain 'sub' field!")  # Debugging output
            raise credentials_exception

        # Fetch user from the database
        user = db.query(User).filter(User.mobile == mobile, User.is_deleted==0).first()
        if not user:
            print(f"User {mobile} not found in database!")  # Debugging output
            raise credentials_exception

        #print(f"Authenticated User: {user.mobile}")  # Debugging output
        return mobile  # ✅ Return authenticated mobile number

    except jwt.ExpiredSignatureError:
        print("Token Expired!")  # Debugging output
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError as e:
        print(f"JWT Error: {e}")  # Debugging output
        raise credentials_exception
