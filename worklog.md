---
Task ID: 1
Agent: Main Agent
Task: Fix all broken features - uploads, hydration errors, chat, payments, auth

Work Log:
- Created /api/upload route.ts - file upload endpoint supporting images, videos, audio (max 10MB, 5 files)
- Fixed FloatingParticles hydration error by replacing Math.random() with deterministic seededRandom() function
- Added new fields to Prisma Message model: messageType, mediaUrl, locationLat, locationLng, locationName
- Ran prisma db:push to sync schema changes
- Updated ChatView to support image, video, audio, and location sharing
- Updated chat messages API to handle new message types
- Updated chat-service mini-service to handle new message types (video, audio, location)
- Started chat-service on port 3003
- Added selectedRoomId to app-store for proper chat navigation
- Fixed product detail handleChat to navigate directly to chat room
- Updated sell-product-form to accept any image format
- Added avatar subfolder support in upload API
- Verified all APIs work end-to-end: register, login, verify, upload, products, transactions, chat rooms, messages

Stage Summary:
- Upload API now works for product images, profile avatars, chat media
- Hydration error from FloatingParticles fixed (deterministic random)
- Chat supports text, image, video, audio, and location sharing
- All authentication flows work properly
- Payment/checkout flow works with 11 payment methods and validation
- Chat mini-service running on port 3003
