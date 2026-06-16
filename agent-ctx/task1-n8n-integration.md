# Task 1: n8n Webhook Integration for AI Chatbot

## Summary
Modified the AI chatbot component to support n8n webhook integration as the primary chat method, with fallback to the existing `/api/ai` endpoint.

## Changes Made

### 1. `/home/z/my-project/src/components/chatbot/ai-chatbot.tsx`
- Added `N8N_WEBHOOK_URL` constant at line 40 that reads from `process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL`
- Modified `sendMessage` function to:
  - Try n8n webhook FIRST if the URL is configured
  - Send message, sessionId, userName, conversationHistory, and source to the webhook
  - Parse response from multiple possible n8n output fields (`response`, `message`, `output`, `text`)
  - On n8n success, display the response with model label 'n8n' and return early
  - On n8n failure (network error or non-ok response), fall back to internal `/api/ai` endpoint
  - Preserve existing `/api/ai` fallback behavior unchanged

### 2. `/home/z/my-project/.env.example`
- Added `NEXT_PUBLIC_N8N_WEBHOOK_URL=` environment variable entry (section 14b)

## Verification
- Lint passes cleanly with no errors
- All other code in the file remains untouched
