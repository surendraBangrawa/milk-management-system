from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import BaseModel
from app.core.i18n import get_translations, SUPPORTED_LANGUAGES

router = APIRouter(
    prefix="/i18n",
    tags=["i18n"],
)


@router.get("/translations")
async def get_translations_endpoint(
    request: Request, lang: str = Query(None, description="Language code (en, hi)")
):
    """Get translations for a specific language"""
    if lang is None:
        # Use language from request state (set by middleware)
        lang = getattr(request.state, "language", "en")

    if lang not in SUPPORTED_LANGUAGES:
        lang = "en"

    translations = get_translations(lang)
    return {"language": lang, "translations": translations}


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {"languages": SUPPORTED_LANGUAGES, "default": "en"}


class LanguageUpdateRequest(BaseModel):
    language: str


@router.post("/language")
async def update_user_language(request: LanguageUpdateRequest):
    """Update user language preference"""
    if request.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language. Supported languages: {SUPPORTED_LANGUAGES}",
        )

    # Here you could store the language preference in the database
    # For now, we'll just return success
    return {
        "message": "Language preference updated successfully",
        "language": request.language,
    }
