import locale
from contextvars import ContextVar
from gettext import GNUTranslations
from typing import Any, Optional

_language_context: ContextVar[str] = ContextVar("_language", default="ja_JP")


class I18N:
    instance: Any | None = None

    def __init__(self):
        I18N.instance = self
        self._locales: dict[str, set[GNUTranslations]] = {}
        self.translation_cache = {}

    def load_translations(self, translations: dict[str, GNUTranslations]):
        for language, trans in translations.items():
            if language in self._locales:
                self._locales[language].add(trans)
            else:
                self._locales[language] = {trans}

            # Initialize the cache for the language if not already done
            if language not in self.translation_cache:
                self.translation_cache[language] = {}

                # Cache all translations for this language
                for key in trans._catalog.keys():
                    translated_value = trans.gettext(key)
                    self.translation_cache[language][key] = translated_value

    def set_language(self, language: Optional[str] = None) -> str:
        language = language or locale.getlocale()[0] or "en_US"
        chosen_language = (
            "ja_JP" if language.lower().startswith(("ja_JP", "japan")) else language
        )
        _language_context.set(chosen_language)
        return chosen_language

    def get_language(self) -> str:
        language = _language_context.get()
        if language.startswith("en_"):
            return "en_US"

        return language

    def gettext(self, value: str, language: Optional[str] = None) -> str:
        language = language or _language_context.get()
        return self.translation_cache.get(language, {}).get(value, value)

    def __call__(
        self, value, default_translation: str = "", language: Optional[str] = None
    ) -> str:
        return self.gettext(str(value), language)


i18n: I18N = I18N()
