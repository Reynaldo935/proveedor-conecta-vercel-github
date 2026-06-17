"""
Multi-Agent Orchestrator for ProveedorConecta Chatbot Service.
Tries AI providers in order: Z.ai -> OpenAI -> Gemini -> DeepSeek -> local fallback.
"""

import os
import logging
from typing import Optional

from connectors.zai import ZAIConnector
from connectors.openai import OpenAIConnector
from connectors.gemini import GeminiConnector
from connectors.deepseek import DeepSeekConnector

logger = logging.getLogger(__name__)


class Orchestrator:
    """Orchestrates multiple AI providers with fallback chain."""

    def __init__(self):
        self.connectors = [
            ("zai", ZAIConnector()),
            ("openai", OpenAIConnector()),
            ("gemini", GeminiConnector()),
            ("deepseek", DeepSeekConnector()),
        ]

    async def orchestrate(
        self,
        message: str,
        context: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> dict:
        """
        Try each provider in order until one succeeds.

        Args:
            message: The user's chat message
            context: Optional conversation context
            user_id: Optional user identifier

        Returns:
            dict with 'message', 'model', and 'provider' keys
        """
        system_prompt = self._build_system_prompt(context)

        for provider_name, connector in self.connectors:
            if not connector.is_available():
                logger.info(f"Provider {provider_name} not available (no API key)")
                continue

            try:
                logger.info(f"Trying provider: {provider_name}")
                result = await connector.query(message, system_prompt, user_id)
                logger.info(f"Provider {provider_name} succeeded")
                return {
                    "message": result["message"],
                    "model": result["model"],
                    "provider": provider_name,
                }
            except Exception as e:
                logger.warning(f"Provider {provider_name} failed: {str(e)}")
                continue

        # All providers failed - use local fallback
        logger.info("All providers failed, using local fallback")
        return {
            "message": self.local_fallback(message, context),
            "model": "local-fallback",
            "provider": "local",
        }

    def local_fallback(
        self,
        message: str,
        context: Optional[str] = None,
    ) -> str:
        """
        Rule-based fallback when all AI providers are unavailable.
        Provides helpful responses for common ProveedorConecta queries.
        """
        message_lower = message.lower().strip()

        # Greeting patterns
        if any(g in message_lower for g in ["hola", "buenos", "buenas", "hey", "saludos"]):
            return (
                "¡Hola! Bienvenido a ProveedorConecta Nicaragua. "
                "¿En qué puedo ayudarte? Puedo asistirte con:\n"
                "- Registro de cuenta y verificación\n"
                "- Publicación de productos\n"
                "- Procesamiento de pagos\n"
                "- Consulta de comisiones\n"
                "- Soporte técnico general"
            )

        # Registration / account
        if any(w in message_lower for w in ["registr", "cuenta", "registro", "sign up"]):
            return (
                "Para registrarte en ProveedorConecta:\n"
                "1. Ve a la sección de registro\n"
                "2. Ingresa tu cédula nicaragüense (13 dígitos)\n"
                "3. Verifica tu correo electrónico\n"
                "4. Completa tu perfil de proveedor\n\n"
                "Recuerda que la cédula debe tener el formato válido de Nicaragua."
            )

        # Payment / commission
        if any(w in message_lower for w in ["pago", "pagar", "comisión", "comision", "payment"]):
            return (
                "Sobre pagos en ProveedorConecta:\n"
                "- La comisión plataforma es del 3%\n"
                "- El vendedor recibe el 97% del monto\n"
                "- Los pagos se procesan de forma segura\n"
                "- Puedes ver tus comisiones en el panel de pagos\n\n"
                "¿Necesitas ayuda con algún pago específico?"
            )

        # Products
        if any(w in message_lower for w in ["producto", "publicar", "vender", "product"]):
            return (
                "Para publicar productos en ProveedorConecta:\n"
                "1. Ve a 'Mi Panel' > 'Mis Productos'\n"
                "2. Haz clic en 'Nuevo Producto'\n"
                "3. Agrega fotos, descripción y precio en NIO (córdobas)\n"
                "4. Establece el stock disponible\n"
                "5. Publica y comienza a vender\n\n"
                "Tip: Las fotos de buena calidad aumentan las ventas un 40%."
            )

        # Cédula / validation
        if any(w in message_lower for w in ["cédula", "cedula", "validar", "verificar"]):
            return (
                "La validación de cédula en Nicaragua:\n"
                "- Formato: 13 dígitos\n"
                "- Incluye código de municipio (001-580)\n"
                "- Usamos el algoritmo de Luhn para tarjetas\n"
                "- Validación telefónica: 8 dígitos, empieza con 5, 7 u 8\n\n"
                "Si tienes problemas con la verificación, contacta a soporte."
            )

        # Help / support
        if any(w in message_lower for w in ["ayuda", "help", "soporte", "problema", "error"]):
            return (
                "Estoy aquí para ayudarte. Puedes preguntarme sobre:\n"
                "- Registro y verificación de cuenta\n"
                "- Publicación y gestión de productos\n"
                "- Pagos y comisiones\n"
                "- Validación de documentos\n"
                "- Funcionalidades de la plataforma\n\n"
                "También puedes contactar a soporte@proveedorconecta.ni"
            )

        # Shipping / delivery
        if any(w in message_lower for w in ["envío", "envio", "entrega", "delivery"]):
            return (
                "Sobre envíos en ProveedorConecta:\n"
                "- Coordina la entrega directamente con el comprador\n"
                "- Recomendamos usar servicios de courier locales\n"
                "- Managua: entrega same-day disponible\n"
                "- Otros departamentos: 2-3 días hábiles\n\n"
                "¿Necesitas información sobre un envío específico?"
            )

        # Default response
        return (
            "Gracias por tu mensaje. Como asistente de ProveedorConecta Nicaragua, "
            "puedo ayudarte con registro de cuenta, publicación de productos, "
            "pagos y comisiones, validación de documentos, y más. "
            "¿Podrías ser más específico sobre tu consulta?"
        )

    def _build_system_prompt(self, context: Optional[str] = None) -> str:
        """Build a system prompt for AI providers."""
        base_prompt = (
            "Eres un asistente virtual de ProveedorConecta Nicaragua, "
            "una plataforma B2B de comercio electrónico para proveedores nicaragüenses. "
            "Respondes en español de forma amable y profesional. "
            "Ayudas con: registro de cuenta, publicación de productos, "
            "pagos y comisiones (3% comisión), validación de cédulas, "
            "y soporte general de la plataforma. "
            "Los precios están en córdobas nicaragüenses (NIO). "
            "Las cédulas tienen 13 dígitos y los teléfonos 8 dígitos (empiezan con 5, 7 u 8)."
        )
        if context:
            base_prompt += f"\n\nContexto de la conversación: {context}"
        return base_prompt

    def get_provider_status(self) -> dict:
        """Return availability status for each provider."""
        status = {}
        for name, connector in self.connectors:
            status[name] = {
                "available": connector.is_available(),
                "name": connector.__class__.__name__,
            }
        status["local-fallback"] = {
            "available": True,
            "name": "LocalFallback",
        }
        return status
