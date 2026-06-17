"""
OpenAI Connector for ProveedorConecta Chatbot Service.
"""

import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class OpenAIConnector:
    """Connector for OpenAI API."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.timeout = 15.0

    def is_available(self) -> bool:
        """Check if OpenAI API key is configured."""
        return bool(self.api_key)

    async def query(
        self,
        message: str,
        system_prompt: str,
        user_id: Optional[str] = None,
    ) -> dict:
        """
        Send a query to OpenAI API.

        Args:
            message: User message
            system_prompt: System prompt
            user_id: Optional user identifier

        Returns:
            dict with 'message' and 'model' keys

        Raises:
            Exception: If the API call fails
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": 0.7,
            "max_tokens": 1024,
        }

        if user_id:
            payload["user"] = user_id

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()

            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            model_used = data.get("model", self.model)

            return {
                "message": reply,
                "model": model_used,
            }
