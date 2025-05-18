from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError, ExpiredSignatureError
from typing import Callable

# Import dependencies from other app modules
from app.db.session import get_db  # Assuming get_db is in app/db/session.py
from app.db.models import User  # Assuming User model is in app/db/models.py
from app.core.security import SECRET_KEY, ALGORITHM  # Import security constants

# Assuming you have a logger configured
import logging

logger = logging.getLogger(__name__)


class JWTMiddleware(BaseHTTPMiddleware):
    """
    Middleware to authenticate requests using a JWT token from the Authorization header.
    It decodes the token, fetches the user from the database, and attaches the user
    object to the request state.
    """

    async def dispatch(self, request: Request, call_next: Callable):
        # Skip authentication for specific paths (e.g., login, docs)
        # You'll need to define a list of paths to exclude
        excluded_paths = [
            "/docs",
            "/openapi.json",
            "/token",
            "/login",
            "/register",
        ]  # Add your public paths here
        if request.url.path in excluded_paths or request.url.path.startswith("/static"):
            return await call_next(request)

        token_header = request.headers.get("Authorization")
        if not token_header:
            logger.warning("Authorization header missing for a protected path.")
            raise HTTPException(status_code=401, detail="Authorization header missing")

        token_list = token_header.split(" ")
        if (
            len(token_list) != 2 or token_list[0].lower() != "bearer"
        ):  # Use .lower() for case-insensitivity
            logger.warning("Invalid token format.")
            raise HTTPException(
                status_code=401,
                detail="Invalid token format. Expected 'Bearer <token>'",
            )

        token = token_list[1]

        try:
            # Decode the JWT token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            mobile: str = payload.get("sub")  # Extract user mobile from token

            if not mobile:
                logger.warning("Invalid token: 'sub' field missing.")
                raise HTTPException(
                    status_code=401, detail="Invalid token, no user information"
                )

            # Create a new DB session for this request
            # Using next(get_db()) gets the session yielded by the dependency
            db: Session = next(get_db())

            # Retrieve user from database
            user = (
                db.query(User)
                .filter(User.mobile == mobile, User.is_deleted == 0)
                .first()
            )
            db.close()  # Close the session after fetching the user

            if not user:
                logger.warning(f"User {mobile} not found or inactive in DB.")
                raise HTTPException(
                    status_code=401, detail="User not found or inactive"
                )

            # Attach user object to request state for access in endpoints
            request.state.user = user
            logger.info(f"Authenticated request for user: {user.mobile}")

        except ExpiredSignatureError:
            logger.warning("Token has expired.")
            raise HTTPException(status_code=401, detail="Token has expired")
        except JWTError:
            logger.warning("Invalid token.")
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Unexpected error in JWTMiddleware: {e}", exc_info=True)
            # Ensure db session is closed in case of unexpected errors
            if "db" in locals() and not db.closed:
                db.close()
            raise HTTPException(
                status_code=500, detail="Internal server error during authentication"
            )

        response = await call_next(request)
        return response
