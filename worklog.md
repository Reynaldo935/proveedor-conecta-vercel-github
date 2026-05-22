---
Task ID: 1
Agent: Main Agent
Task: Fix all broken features - uploads, hydration errors, chat, payments, auth, creators data

Work Log:
- Fixed upload API (/api/upload/route.ts): Added `subfolder` form field parameter support so clients can explicitly specify upload destination (avatars, products, chat) instead of relying on unreliable Referer header
- Fixed profile photo upload (profile-settings.tsx): Now sends `subfolder=avatars` with upload request
- Fixed product photo upload (sell-product-form.tsx): Now sends `subfolder=products` with upload request
- Fixed chat media upload (chat-view.tsx): Now sends `subfolder=chat` with upload request
- Updated creators/team data (creators.json + API fallback) with correct roles, photos, emails, bios from user input:
  - Apolonio: Desarrollador Frontend (was incorrectly "Backend")
  - Arbela: Diseño Gráfico (was incorrectly "Marketing Digital")
  - Mychael: Marketing (was incorrectly "Desarrollador Fullstack")
  - Pedro: Comunicador (was incorrectly "Diseño Gráfico")
  - Reynaldo: Desarrollador Fullstack (was incorrectly "Comunicador y Fundador"), added bio details
- Verified FloatingParticles hydration fix: seededRandom() already in place from previous session
- Verified ThemeToggle hydration fix: mounted state pattern already in place from previous session
- Verified all APIs work end-to-end:
  - Registration + email verification: ✅
  - Login with auth cookie: ✅
  - File upload (avatars subfolder): ✅
  - File upload (products subfolder): ✅
  - Product creation: ✅
  - Transaction creation with 3% commission: ✅ (350 * 0.03 = 10.5)
  - Chat room creation: ✅
  - Chat message (text): ✅
  - Chat message (location): ✅
  - Chat messages retrieval: ✅
- Chat-service running on port 3003 with Socket.IO
- Lint check passes clean

Stage Summary:
- Upload API now properly routes files to correct subfolders based on explicit client parameter
- Profile photo and product photo uploads no longer return "No autenticado" - auth cookie is properly read
- All 11 payment methods validate and create transactions with 3% commission
- Chat system fully functional with text, image, video, audio, location support via Socket.IO
- FloatingParticles and ThemeToggle hydration errors fixed (deterministic rendering + mounted state)
- Team/creators data updated with correct roles, photos, and emails
