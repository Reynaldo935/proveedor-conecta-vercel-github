"""
Gemini Connector for ProveedorConecta Chatbot Service.
"""

import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class GeminiConnector:
    """Connector for Google Gemini API."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.base_url = os.getenv(
            "GEMINI_BASE_URL",
            "https://generativelanguage.googleapis.com/v1beta",
        )
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.timeout = 15.0

    def is_available(self) -> bool:
        """Check if Gemini API key is configured."""
        return bool(self.api_key)

    async def query(
        self,
        message: str,
        system_prompt: str,
        user_id: Optional[str] = None,
    ) -> dict:
        """
        Send a query to Google Gemini API.

        Args:
            message: User message
            system_prompt: System prompt
            user_id: Optional user identifier

        Returns:
            dict with 'message' and 'model' keys

        Raises:
            Exception: If the API call fails
        """
        url = (
            f"{self.base_url}/models/{self.model}:generateContent"
            f"?key={self.api_key}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\nUser: {message}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()

            data = response.json()
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
            model_used = data.get("modelVersion", self.model)

            return {
                "message": reply,
                "model": model_used,
            }
