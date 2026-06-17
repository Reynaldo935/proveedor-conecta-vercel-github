"""
ProveedorConecta Nicaragua - AI Chatbot Service
FastAPI application with multi-agent orchestrator for AI-powered chat.
"""

import os
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from orchestrator import Orchestrator

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ProveedorConecta Chatbot Service",
    description="AI Chatbot microservice with multi-provider fallback",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = Orchestrator()


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    userId: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool
    data: dict


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "chatbot-service",
        "version": "1.0.0",
        "providers": orchestrator.get_provider_status(),
    }


@app.post("/api/chatbot/query", response_model=ChatResponse)
async def query_chatbot(request: ChatRequest):
    """
    Process a chatbot query using the multi-agent orchestrator.
    Tries providers in order: Z.ai -> OpenAI -> Gemini -> DeepSeek -> local fallback.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    try:
        result = await orchestrator.orchestrate(
            message=request.message,
            context=request.context,
            user_id=request.userId,
        )

        return ChatResponse(
            success=True,
            data={
                "message": result["message"],
                "model": result["model"],
                "provider": result.get("provider", "unknown"),
            },
        )
    except Exception as e:
        logger.error(f"Chatbot query failed: {str(e)}")
        # Return local fallback even on complete failure
        fallback_message = orchestrator.local_fallback(request.message, request.context)
        return ChatResponse(
            success=True,
            data={
                "message": fallback_message,
                "model": "local-fallback",
                "provider": "local",
            },
        )


@app.get("/api/chatbot/providers")
async def list_providers():
    """List available AI providers and their status."""
    return {
        "success": True,
        "data": orchestrator.get_provider_status(),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
