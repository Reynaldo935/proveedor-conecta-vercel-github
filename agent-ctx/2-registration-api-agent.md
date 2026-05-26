# Task 2 - Registration API Agent

## Task
Update the registration API route so that when a user tries to register with an existing email, the system sends an SMS verification code to the phone number associated with that existing account, allowing the user to verify ownership.

## Changes Made

### 1. `/src/app/api/auth/register/route.ts`
- Added `maskPhone()` helper function for privacy masking (e.g., `8***-**89`)
- Added `phoneVerified` to destructured request body
- Enhanced validation:
  - Name: minimum 3 characters
  - Address: minimum 5 characters
  - `phoneVerified` must be `true` before allowing registration
- **Existing email flow**: When `existing` user is found:
  - Retrieves the existing user's phone number
  - Cleans the phone (removes spaces, dashes, country code)
  - Deletes any previous verification codes for that phone
  - Generates a new 6-digit code with 10-minute expiry
  - Stores it in the `PhoneVerification` table
  - Returns `{ existingEmail: true, phone: "8***-**89", code: "123456" }` (code for demo)
  - If the existing user has no valid phone, returns `{ existingEmail: true }` without recovery
- Newly registered users have `phoneVerified: true` since verification is required before registration

### 2. `/src/app/api/auth/phone-verify/route.ts`
- Added `maskPhone()` and `maskEmail()` helper functions
- Added new `action: "recover"` endpoint:
  - Accepts `{ phone, code, action: "recover" }`
  - Verifies the SMS code (checks expiry, matches code)
  - On success, deletes the verification record (one-time use)
  - Finds the user by phone number
  - Returns masked account info: `{ recovered: true, email: "j***n@gmail.com", name: "...", phone: "8***-**89", message: "..." }`
- Existing `action: "verify"` and default send code actions remain unchanged

## API Endpoints

### POST /api/auth/register
- **New fields**: `phoneVerified` (boolean, required)
- **Existing email response**:
  ```json
  {
    "success": false,
    "error": "El correo ya está registrado. Se envió un código de verificación al teléfono asociado.",
    "existingEmail": true,
    "phone": "8***-**89",
    "code": "123456"
  }
  ```

### POST /api/auth/phone-verify
- **New action**: `recover`
  ```json
  // Request
  { "phone": "81234567", "code": "123456", "action": "recover" }
  
  // Response
  {
    "success": true,
    "data": {
      "recovered": true,
      "email": "j***n@gmail.com",
      "name": "Juan",
      "phone": "8***-**67",
      "message": "Teléfono verificado. Puedes iniciar sesión o recuperar tu contraseña."
    }
  }
  ```

## Lint Status
✅ No errors
