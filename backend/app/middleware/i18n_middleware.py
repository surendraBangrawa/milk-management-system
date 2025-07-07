from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.i18n import get_language_from_request


class I18nMiddleware(BaseHTTPMiddleware):
    """Middleware to handle internationalization"""

    async def dispatch(self, request: Request, call_next):
        # Detect language from request
        language = get_language_from_request(request)

        # Add language to request state
        request.state.language = language

        # Add language to response headers
        response = await call_next(request)
        response.headers["Content-Language"] = language

        return response
