import os
import json
from typing import Dict, Any, Optional
from fastapi import Request
from pathlib import Path

# Supported languages
SUPPORTED_LANGUAGES = ["en", "hi"]
DEFAULT_LANGUAGE = "en"

# Translation data
_translations: Dict[str, Dict[str, Any]] = {}


def load_translations():
    """Load translation files from the shared translations directory"""
    # Try shared translations first
    shared_dir = Path(__file__).parent.parent.parent.parent / "shared" / "translations"

    if shared_dir.exists():
        # Load from shared translations
        for lang in SUPPORTED_LANGUAGES:
            lang_file = shared_dir / f"{lang}.json"
            if lang_file.exists():
                with open(lang_file, "r", encoding="utf-8") as f:
                    _translations[lang] = json.load(f)
            else:
                print(f"Warning: Shared translation file not found for {lang}")

        # If we loaded translations, return
        if _translations:
            return

    # Fallback to local locales directory
    locales_dir = Path(__file__).parent.parent.parent / "locales"

    if not locales_dir.exists():
        # Create locales directory and default translation files
        locales_dir.mkdir(exist_ok=True)
        create_default_translations(locales_dir)

    for lang in SUPPORTED_LANGUAGES:
        lang_file = locales_dir / f"{lang}.json"
        if lang_file.exists():
            with open(lang_file, "r", encoding="utf-8") as f:
                _translations[lang] = json.load(f)
        else:
            # Create default translation file if it doesn't exist
            create_language_file(locales_dir, lang)


def create_default_translations(locales_dir: Path):
    """Create default translation files"""
    # English translations
    en_translations = {
        "auth": {
            "user_registered": "User registered successfully!",
            "user_reactivated": "User reactivated successfully!",
            "user_already_exists": "User with this mobile number already exists",
            "mobile_not_registered": "Mobile number not registered. Please sign up first.",
            "otp_sent_success": "OTP sent successfully to your mobile number.",
            "otp_wait_message": "Please wait 3 minutes before requesting another OTP",
            "too_many_otp_attempts": "Too many OTP attempts. Please try again after 60 minutes.",
            "otp_not_requested": "Please request an OTP first before logging in.",
            "invalid_otp": "Invalid OTP. Please try again.",
            "login_success": "Login successful!",
            "logout_success": "Logout successful!",
            "something_went_wrong": "Something went wrong",
            "unable_to_send_otp": "Unable to send OTP. Please try again later.",
        },
        "customers": {
            "customer_created": "Customer created successfully!",
            "customer_updated": "Customer updated successfully!",
            "customer_deleted": "Customer deleted successfully!",
            "customer_not_found": "Customer not found",
            "customer_already_exists": "Customer with this mobile number already exists",
        },
        "transactions": {
            "transaction_created": "Transaction created successfully!",
            "transaction_updated": "Transaction updated successfully!",
            "transaction_deleted": "Transaction deleted successfully!",
            "transaction_not_found": "Transaction not found",
            "invalid_amount": "Invalid amount provided",
        },
        "profile": {
            "profile_updated": "Profile updated successfully!",
            "profile_not_found": "Profile not found",
            "invalid_data": "Invalid data provided",
        },
        "subscriptions": {
            "subscription_created": "Subscription created successfully!",
            "subscription_updated": "Subscription updated successfully!",
            "subscription_cancelled": "Subscription cancelled successfully!",
            "subscription_not_found": "Subscription not found",
            "payment_success": "Payment successful!",
            "payment_failed": "Payment failed",
            "invalid_subscription": "Invalid subscription plan",
        },
        "ratelist": {
            "rate_created": "Rate list created successfully!",
            "rate_updated": "Rate list updated successfully!",
            "rate_deleted": "Rate list deleted successfully!",
            "rate_not_found": "Rate list not found",
            "upload_success": "Rate list uploaded successfully!",
            "upload_failed": "Failed to upload rate list",
        },
        "common": {
            "success": "Success",
            "error": "Error",
            "not_found": "Not found",
            "unauthorized": "Unauthorized",
            "forbidden": "Forbidden",
            "bad_request": "Bad request",
            "internal_server_error": "Internal server error",
            "validation_error": "Validation error",
        },
    }

    # Hindi translations
    hi_translations = {
        "auth": {
            "user_registered": "उपयोगकर्ता सफलतापूर्वक पंजीकृत!",
            "user_reactivated": "उपयोगकर्ता सफलतापूर्वक पुनः सक्रिय!",
            "user_already_exists": "इस मोबाइल नंबर के साथ उपयोगकर्ता पहले से मौजूद है",
            "mobile_not_registered": "मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले साइन अप करें।",
            "otp_sent_success": "आपके मोबाइल नंबर पर OTP सफलतापूर्वक भेजा गया।",
            "otp_wait_message": "कृपया दूसरा OTP अनुरोध करने से पहले 3 मिनट प्रतीक्षा करें",
            "too_many_otp_attempts": "बहुत अधिक OTP प्रयास। कृपया 60 मिनट बाद फिर से प्रयास करें।",
            "otp_not_requested": "कृपया लॉगिन करने से पहले OTP अनुरोध करें।",
            "invalid_otp": "अमान्य OTP। कृपया फिर से प्रयास करें।",
            "login_success": "लॉगिन सफल!",
            "logout_success": "लॉगआउट सफल!",
            "something_went_wrong": "कुछ गलत हो गया",
            "unable_to_send_otp": "OTP भेजने में असमर्थ। कृपया बाद में फिर से प्रयास करें।",
        },
        "customers": {
            "customer_created": "ग्राहक सफलतापूर्वक बनाया गया!",
            "customer_updated": "ग्राहक सफलतापूर्वक अपडेट किया गया!",
            "customer_deleted": "ग्राहक सफलतापूर्वक हटाया गया!",
            "customer_not_found": "ग्राहक नहीं मिला",
            "customer_already_exists": "इस मोबाइल नंबर के साथ ग्राहक पहले से मौजूद है",
        },
        "transactions": {
            "transaction_created": "लेन-देन सफलतापूर्वक बनाया गया!",
            "transaction_updated": "लेन-देन सफलतापूर्वक अपडेट किया गया!",
            "transaction_deleted": "लेन-देन सफलतापूर्वक हटाया गया!",
            "transaction_not_found": "लेन-देन नहीं मिला",
            "invalid_amount": "अमान्य राशि प्रदान की गई",
        },
        "profile": {
            "profile_updated": "प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया!",
            "profile_not_found": "प्रोफ़ाइल नहीं मिला",
            "invalid_data": "अमान्य डेटा प्रदान किया गया",
        },
        "subscriptions": {
            "subscription_created": "सदस्यता सफलतापूर्वक बनाई गई!",
            "subscription_updated": "सदस्यता सफलतापूर्वक अपडेट की गई!",
            "subscription_cancelled": "सदस्यता सफलतापूर्वक रद्द की गई!",
            "subscription_not_found": "सदस्यता नहीं मिली",
            "payment_success": "भुगतान सफल!",
            "payment_failed": "भुगतान विफल",
            "invalid_subscription": "अमान्य सदस्यता योजना",
        },
        "ratelist": {
            "rate_created": "रेट लिस्ट सफलतापूर्वक बनाई गई!",
            "rate_updated": "रेट लिस्ट सफलतापूर्वक अपडेट की गई!",
            "rate_deleted": "रेट लिस्ट सफलतापूर्वक हटाई गई!",
            "rate_not_found": "रेट लिस्ट नहीं मिली",
            "upload_success": "रेट लिस्ट सफलतापूर्वक अपलोड की गई!",
            "upload_failed": "रेट लिस्ट अपलोड करने में विफल",
        },
        "common": {
            "success": "सफलता",
            "error": "त्रुटि",
            "not_found": "नहीं मिला",
            "unauthorized": "अनधिकृत",
            "forbidden": "निषिद्ध",
            "bad_request": "खराब अनुरोध",
            "internal_server_error": "आंतरिक सर्वर त्रुटि",
            "validation_error": "सत्यापन त्रुटि",
        },
    }

    # Write translation files
    with open(locales_dir / "en.json", "w", encoding="utf-8") as f:
        json.dump(en_translations, f, ensure_ascii=False, indent=2)

    with open(locales_dir / "hi.json", "w", encoding="utf-8") as f:
        json.dump(hi_translations, f, ensure_ascii=False, indent=2)


def create_language_file(locales_dir: Path, lang: str):
    """Create a language file with default translations"""
    if lang == "en":
        create_default_translations(locales_dir)
    else:
        # For other languages, create a copy of English as a starting point
        en_file = locales_dir / "en.json"
        if en_file.exists():
            with open(en_file, "r", encoding="utf-8") as f:
                default_translations = json.load(f)

            with open(locales_dir / f"{lang}.json", "w", encoding="utf-8") as f:
                json.dump(default_translations, f, ensure_ascii=False, indent=2)


def get_language_from_request(request: Request) -> str:
    """Extract language from request headers or query parameters"""
    # Check Accept-Language header
    accept_language = request.headers.get("accept-language", "")
    if accept_language:
        # Parse Accept-Language header (e.g., "en-US,en;q=0.9,hi;q=0.8")
        languages = accept_language.split(",")
        for lang in languages:
            lang_code = lang.split(";")[0].split("-")[0].strip()
            if lang_code in SUPPORTED_LANGUAGES:
                return lang_code

    # Check query parameter
    lang_param = request.query_params.get("lang")
    if lang_param and lang_param in SUPPORTED_LANGUAGES:
        return lang_param

    # Check Authorization header for language preference
    auth_header = request.headers.get("authorization", "")
    if auth_header and auth_header.startswith("Bearer "):
        # You could decode the JWT token here to extract language preference
        # For now, we'll use the default
        pass

    return DEFAULT_LANGUAGE


def t(key: str, lang: Optional[str] = None, **kwargs) -> str:
    """Translate a key to the specified language"""
    if not _translations:
        load_translations()

    if lang is None:
        lang = DEFAULT_LANGUAGE

    if lang not in _translations:
        lang = DEFAULT_LANGUAGE

    # Split the key by dots to navigate nested structure
    keys = key.split(".")
    value = _translations[lang]

    try:
        for k in keys:
            value = value[k]

        # Replace placeholders if any
        if isinstance(value, str) and kwargs:
            for placeholder, replacement in kwargs.items():
                value = value.replace(f"{{{placeholder}}}", str(replacement))

        return str(value)
    except (KeyError, TypeError):
        # Return the key itself if translation not found
        return key


def get_translations(lang: Optional[str] = None) -> Dict[str, Any]:
    """Get all translations for a language"""
    if not _translations:
        load_translations()

    if lang is None:
        lang = DEFAULT_LANGUAGE

    if lang not in _translations:
        lang = DEFAULT_LANGUAGE

    return _translations[lang]


# Initialize translations on module import
load_translations()
