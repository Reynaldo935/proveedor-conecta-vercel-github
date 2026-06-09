# Task 2-a: Polyglot Microservice Creator

## Task
Create polyglot microservice code for ProveedorConecta Nicaragua - standalone services deployable to Google Cloud Run, Azure Container Instances, or Vercel serverless functions.

## Work Completed

### 1. Chatbot Service (Python FastAPI) - Port 8001
- **main.py**: FastAPI app with `/api/chatbot/query` POST endpoint, `/health` GET endpoint, `/api/chatbot/providers` GET endpoint
- **orchestrator.py**: Multi-agent orchestrator with fallback chain (Z.ai → OpenAI → Gemini → DeepSeek → local fallback). Includes comprehensive rule-based local fallback for common ProveedorConecta queries (registration, payments, products, validation, shipping)
- **connectors/zai.py**: Z.ai LLM API connector with async httpx client
- **connectors/openai.py**: OpenAI API connector (GPT-4o-mini default)
- **connectors/gemini.py**: Google Gemini API connector (gemini-2.0-flash default)
- **connectors/deepseek.py**: DeepSeek API connector
- **connectors/__init__.py**: Package init
- **requirements.txt**: fastapi, uvicorn, httpx, python-dotenv, pydantic
- **Dockerfile**: Python 3.12-slim with health check

### 2. Validation Service (Go) - Port 8080
- **main.go**: HTTP server with 5 routes:
  - `GET /api/validate/luhn?number=...` - Full Luhn algorithm with card type identification (Visa, Mastercard, Amex, etc.)
  - `GET /api/validate/cedula?number=...` - Nicaraguan cédula validation (13 digits, municipality code 001-580, birth date check)
  - `GET /api/validate/phone?number=...` - Nicaraguan phone validation (8 digits, starts with 5/7/8, carrier identification)
  - `GET /api/validate/account?number=...` - Bank account validation (9-16 digits, bank prefix identification)
  - `GET /health` - Health check
- **go.mod**: Go 1.22 module
- **Dockerfile**: Multi-stage Go 1.22-alpine build

### 3. Payment Engine (Java Spring Boot) - Port 8081
- **pom.xml**: Spring Boot 3.2.5, Web starter, Validation starter, Jackson JSR310
- **PaymentEngineApplication.java**: Main Spring Boot application
- **PaymentController.java**: REST controller with:
  - `POST /api/payments/process` - Process payment with 3% commission split, integrity verification
  - `POST /api/payments/commission` - Calculate commission without processing
  - `GET /api/payments/health` - Health check with commission rate
- **PaymentRequest.java**: Request model with validation (amount > 0, buyerId/sellerId required, max C$1,000,000)
- **PaymentResponse.java**: Response model with factory methods (success, failure, commissionCalculation)
- **CommissionService.java**: BigDecimal-based commission calculation (3% platform, 97% seller), integrity verification
- **Dockerfile**: Eclipse Temurin JDK 21 multi-stage build

### 4. Admin Service (C# .NET 8) - Port 8082
- **Program.cs**: Minimal API with:
  - `GET /api/admin/stats` - Comprehensive dashboard statistics (users, products, transactions, revenue, geography, platform metrics)
  - `GET /api/admin/reports/pdf` - PDF report generation (ventas, usuarios, comisiones, general)
  - `GET /api/admin/reports/excel` - Excel/CSV report generation with proper formatting
  - `GET /api/admin/health` - Health check
- **admin-service.csproj**: .NET 8 web app with QuestPDF and ClosedXML packages
- **Dockerfile**: .NET 8 SDK/runtime multi-stage build

### 5. Email Service (PHP Slim) - Port 8083
- **index.php**: Slim Framework 4 application with:
  - `POST /api/email/verify` - Send verification email with 6-digit code, HTML template, simulation mode
  - `POST /api/email/reset-password` - Send password reset email with token, HTML template, simulation mode
  - `GET /api/email/health` - Health check with SMTP status
  - Professional HTML email templates with ProveedorConecta branding
  - Simulation mode when SMTP not configured
- **composer.json**: slim/slim 4, slim/psr7, phpmailer/phpmailer
- **Dockerfile**: PHP 8.2 Apache with Composer

### 6. Docker Compose
- **docker-compose.yml**: All 5 services with:
  - Shared `proveedorconecta` bridge network
  - Environment variables from .env
  - Port mappings (8001, 8080, 8081, 8082, 8083)
  - Health checks for all services
  - Restart policies

### 7. GitHub Actions CI/CD
- **.github/workflows/deploy.yml**: Complete pipeline with:
  - Separate build/test jobs for each service
  - Integration test job using Docker Compose
  - Deploy jobs: chatbot+validation+email → Google Cloud Run, payment+admin → Azure Container Instances
  - Only triggers on main branch push after integration tests pass

## Architecture
- All services include CORS headers
- All services have health check endpoints
- All services have Dockerfiles with health checks
- Error handling throughout
- No stubs - all code is complete and functional
