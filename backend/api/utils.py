from django.utils import translation

from config.settings import DEFAULT_LANGUAGE_CODE


def get_obj_name_in_preferred_language(obj):
    lang_code = translation.get_language() or DEFAULT_LANGUAGE_CODE
    # Try exact match
    match = obj.translations.filter(language_code=lang_code).first()
    if match:
        return match.name

    # Fall back to English if available
    en_match = obj.translations.filter(language_code="en").first()
    if en_match:
        return en_match.name

    # Fallback to any translation
    any_match = obj.translations.first()
    return any_match.name if any_match else None
