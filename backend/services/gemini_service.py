from __future__ import annotations

import json
from urllib import error, request

from ..config import settings


class GeminiServiceError(Exception):
    """Raised when Gemini cannot return a usable response."""


class GeminiService:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.gemini_api_key
        self.model = model or settings.gemini_model

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise GeminiServiceError('Gemini API key is not configured')

        endpoint = f'https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}'
        payload = json.dumps({'contents': [{'parts': [{'text': prompt}]}]}).encode('utf-8')
        request_data = request.Request(
            endpoint,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        try:
            with request.urlopen(request_data, timeout=30) as response:
                body = json.loads(response.read().decode('utf-8'))
        except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise GeminiServiceError('Gemini request failed') from exc

        try:
            return body['candidates'][0]['content']['parts'][0]['text'].strip()
        except (KeyError, IndexError, TypeError, AttributeError) as exc:
            raise GeminiServiceError('Gemini returned an incomplete response') from exc
