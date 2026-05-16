---
Task ID: 1
Agent: Main Developer
Task: Fix critical bugs and enhance registration with phone verification

Work Log:
- Fixed Prisma schema - added PhoneVerification model, phoneVerified field to User, department field to User
- Fixed /api/auth/verify/route.ts - changed findUnique to findFirst for token lookup (resolves Prisma error)
- Fixed /api/auth/register/route.ts - now saves all fields (phone, department, address) with full Nicaragua validation
- Created /api/auth/phone-verify/route.ts - SMS code verification endpoint (send + verify)
- Updated /api/auth/google/route.ts - saves phone/department/address, validates email with correoInvalido
- Updated /api/auth/me/route.ts - returns phoneVerified field
- Rewrote Register form with 4 steps: Account Type → Personal Data (ALL required) → Phone SMS Verification → Password
- Phone verification sends 6-digit code, shows code in demo mode, requires verification before proceeding
- All form fields validated: name (3+ chars), email (format+MX), phone (8XXX-XXXX), department (from 17 Nicaragua departments), address (5+ chars)
- Updated auth store with department and phoneVerified fields
- Restarted dev server to pick up new Prisma client
- Tested all endpoints: register, verify, phone-verify, product detail, login - all working

Stage Summary:
- Registration now requires ALL fields (name, email, phone, department, address)
- Phone verification via SMS code is fully functional (6-digit code, 10-minute expiry)
- Email verification shows "correo invalido" for fake/non-existent Google accounts
- Product detail API no longer crashes on quantityDiscounts include
- Database schema fully synced with PhoneVerification model
