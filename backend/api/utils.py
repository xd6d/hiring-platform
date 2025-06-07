from django.utils import translation

from config.settings import DEFAULT_LANGUAGE_CODE, AVAILABLE_LANGUAGES


def get_language_code():
    request_lang_code = translation.get_language() or DEFAULT_LANGUAGE_CODE
    lang_code = request_lang_code if request_lang_code in AVAILABLE_LANGUAGES else DEFAULT_LANGUAGE_CODE
    return lang_code
