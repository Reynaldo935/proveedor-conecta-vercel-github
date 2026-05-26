# Task 3: Register Form - Existing Email SMS Verification Flow

## Agent: full-stack-developer

## Task
Update the registration form component to handle existing email detection with SMS verification, and update the color palette to Nicaragua Edition.

## Changes Made

### File Modified: `/home/z/my-project/src/components/auth/register-form.tsx`

### 1. New State: existingEmailState
```typescript
const [existingEmailState, setExistingEmailState] = useState<{
  show: boolean
  email: string
  phone: string
  code: string
  inputCode: string
  verifying: boolean
  verified: boolean
}>({ show: false, email: '', phone: '', code: '', inputCode: '', verifying: false, verified: false })
```

### 2. Modified handleSubmit
When API returns `existingEmail: true`, sets `existingEmailState` with:
- `email`: the email that already exists
- `phone`: masked phone from API (e.g., "8***-**89")
- `code`: demo verification code from API
- Triggers overlay modal display

### 3. New Handler: handleVerifyExistingEmail
- Sends 6-digit code to `/api/auth/phone-verify` with `existingEmailVerification: true` flag
- On success: sets `verified: true` in existingEmailState
- On failure: shows error toast

### 4. Overlay UI (existingEmailState.show)
**Before verification:**
- Warning triangle icon (amber)
- "Este correo ya está registrado" heading
- Email displayed
- Masked phone number shown with verde laguna styling
- Demo code display (amber themed)
- 6-digit code input + green verify button
- Helper text explaining the flow

**After verification:**
- Green check icon
- "¡Verificado!" heading
- "Este correo pertenece a una cuenta existente" message
- Green verified card
- "Iniciar Sesión" button → navigates to login (verde laguna gradient)
- "Recuperar Contraseña" button → shows toast (dorado border accent)

### 5. Color Palette Updates
All old blue hex codes replaced:
| Old | New | Usage |
|-----|-----|-------|
| `#1A5276` | `#00695C` | Primary verde laguna |
| `#2E86C1` | `#00897B` | Mid laguna |
| `#154360` | `#004D40` | Dark laguna (hover) |
| `#2471A3` | `#00695C` | Hover mid |
| `#3498DB` | `#00BFA5` | Bright laguna/turquesa |
| `#F4D03F` | `#D4A017` | Dorado accent |

### 6. New Icon Imports
- `AlertTriangle` - for existing email warning
- `KeyRound` - for password recovery button
- `LogIn` - for login button

## Validation
- All Step 2 fields already had red error messages (text-destructive class) - confirmed working
- Lint check passed with zero errors
