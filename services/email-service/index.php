<?php
/**
 * ProveedorConecta Nicaragua - Email Service
 *
 * PHP Slim Framework application for sending verification and
 * password reset emails. Uses PHPMailer for email delivery.
 */

require __DIR__ . '/vendor/autoload.php';

use Slim\Factory\AppFactory;
use Slim\Psr7\Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// Create Slim app
$app = AppFactory::create();

// Add Body Parsing Middleware
$app->addBodyParsingMiddleware();

// Add CORS middleware
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

// Handle preflight OPTIONS requests
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// ============================================
// Email configuration from environment
// ============================================
function getEmailConfig(): array
{
    return [
        'host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
        'port' => (int)(getenv('SMTP_PORT') ?: 587),
        'username' => getenv('SMTP_USERNAME') ?: '',
        'password' => getenv('SMTP_PASSWORD') ?: '',
        'from_email' => getenv('SMTP_FROM_EMAIL') ?: 'noreply@proveedorconecta.ni',
        'from_name' => getenv('SMTP_FROM_NAME') ?: 'ProveedorConecta Nicaragua',
        'encryption' => getenv('SMTP_ENCRYPTION') ?: 'tls',
    ];
}

/**
 * Create and configure PHPMailer instance
 */
function createMailer(): PHPMailer\PHPMailer\PHPMailer
{
    $config = getEmailConfig();
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    // Server settings
    $mail->isSMTP();
    $mail->Host = $config['host'];
    $mail->Port = $config['port'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];

    if ($config['encryption'] === 'tls') {
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    } elseif ($config['encryption'] === 'ssl') {
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    }

    $mail->CharSet = 'UTF-8';

    // From settings
    $mail->setFrom($config['from_email'], $config['from_name']);

    return $mail;
}

/**
 * Generate a verification code
 */
function generateVerificationCode(): string
{
    return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * Generate a password reset token
 */
function generateResetToken(): string
{
    return bin2hex(random_bytes(32));
}

/**
 * Build HTML email template
 */
function buildEmailTemplate(string $title, string $content, string $buttonText = '', string $buttonUrl = ''): string
{
    $buttonHtml = '';
    if ($buttonText && $buttonUrl) {
        $buttonHtml = <<<HTML
        <div style="text-align: center; margin: 30px 0;">
            <a href="{$buttonUrl}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                {$buttonText}
            </a>
        </div>
        HTML;
    }

    return <<<HTML
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{$title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
        <table role="presentation" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #059669; padding: 30px 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">ProveedorConecta</h1>
                                <p style="color: #d1fae5; margin: 5px 0 0; font-size: 14px;">Nicaragua</p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px;">{$title}</h2>
                                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                                    {$content}
                                </div>
                                {$buttonHtml}
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                    © 2026 ProveedorConecta Nicaragua. Todos los derechos reservados.
                                </p>
                                <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0;">
                                    Managua, Nicaragua | soporte@proveedorconecta.ni
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    HTML;
}

/**
 * Build plain text email content
 */
function buildPlainTextContent(string $title, string $content): string
{
    return "{$title}\n" . str_repeat('=', 40) . "\n\n{$content}\n\n" .
           "—\nProveedorConecta Nicaragua\nManagua, Nicaragua\nsoporte@proveedorconecta.ni";
}

// ============================================
// Routes
// ============================================

/**
 * Health Check
 * GET /api/email/health
 */
$app->get('/api/email/health', function (Request $request, Response $response) {
    $config = getEmailConfig();
    $smtpConfigured = !empty($config['username']) && !empty($config['password']);

    $data = [
        'status' => 'healthy',
        'service' => 'email-service',
        'version' => '1.0.0',
        'smtpConfigured' => $smtpConfigured,
        'smtpHost' => $config['host'],
        'smtpPort' => $config['port'],
    ];

    $response->getBody()->write(json_encode([
        'success' => true,
        'data' => $data,
    ]));

    return $response->withHeader('Content-Type', 'application/json');
});

/**
 * Send Verification Email
 * POST /api/email/verify
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "code": "123456" (optional, auto-generated if not provided)
 * }
 */
$app->post('/api/email/verify', function (Request $request, Response $response) {
    $body = $request->getParsedBody();

    // Validate input
    $email = $body['email'] ?? '';
    $name = $body['name'] ?? 'Usuario';
    $code = $body['code'] ?? generateVerificationCode();

    if (empty($email)) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'El campo email es requerido',
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'El formato del email no es válido',
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    $baseUrl = getenv('APP_BASE_URL') ?: 'https://proveedorconecta.ni';
    $verifyUrl = "{$baseUrl}/verify?email=" . urlencode($email) . "&code={$code}";

    // Build email content
    $htmlContent = buildEmailTemplate(
        'Verifica tu cuenta',
        "<p>Hola <strong>" . htmlspecialchars($name) . "</strong>,</p>
         <p>Gracias por registrarte en ProveedorConecta Nicaragua. Para completar tu registro, por favor verifica tu dirección de correo electrónico.</p>
         <p>Tu código de verificación es: <strong style=\"font-size: 24px; color: #059669;\">{$code}</strong></p>
         <p>Este código expira en 24 horas.</p>
         <p>Si no creaste una cuenta, puedes ignorar este correo.</p>",
        'Verificar mi cuenta',
        $verifyUrl
    );

    $textContent = buildPlainTextContent(
        'Verifica tu cuenta',
        "Hola {$name},\n\n" .
        "Gracias por registrarte en ProveedorConecta Nicaragua.\n\n" .
        "Tu código de verificación es: {$code}\n\n" .
        "Verifica tu cuenta en: {$verifyUrl}\n\n" .
        "Este código expira en 24 horas.\n\n" .
        "Si no creaste una cuenta, puedes ignorar este correo."
    );

    try {
        $mail = createMailer();
        $mail->addAddress($email, $name);
        $mail->Subject = 'ProveedorConecta - Verifica tu cuenta';
        $mail->Body = $htmlContent;
        $mail->AltBody = $textContent;
        $mail->isHTML(true);

        $config = getEmailConfig();

        // If SMTP is not configured, simulate success
        if (empty($config['username']) || empty($config['password'])) {
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'message' => 'Email de verificación enviado (simulado - SMTP no configurado)',
                    'email' => $email,
                    'code' => $code,
                    'mode' => 'simulation',
                ],
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $mail->send();

        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'message' => 'Email de verificación enviado exitosamente',
                'email' => $email,
                'code' => $code,
                'mode' => 'live',
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json');

    } catch (Exception $e) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'Error al enviar el email: ' . $e->getMessage(),
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
});

/**
 * Send Password Reset Email
 * POST /api/email/reset-password
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "token": "abc123" (optional, auto-generated if not provided)
 * }
 */
$app->post('/api/email/reset-password', function (Request $request, Response $response) {
    $body = $request->getParsedBody();

    // Validate input
    $email = $body['email'] ?? '';
    $name = $body['name'] ?? 'Usuario';
    $token = $body['token'] ?? generateResetToken();

    if (empty($email)) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'El campo email es requerido',
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'El formato del email no es válido',
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    $baseUrl = getenv('APP_BASE_URL') ?: 'https://proveedorconecta.ni';
    $resetUrl = "{$baseUrl}/reset-password?token={$token}&email=" . urlencode($email);

    // Build email content
    $htmlContent = buildEmailTemplate(
        'Restablece tu contraseña',
        "<p>Hola <strong>" . htmlspecialchars($name) . "</strong>,</p>
         <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en ProveedorConecta Nicaragua.</p>
         <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
         <p style=\"color: #6b7280; font-size: 14px;\">Este enlace expira en 1 hora por seguridad.</p>
         <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu contraseña actual no será modificada.</p>",
        'Restablecer contraseña',
        $resetUrl
    );

    $textContent = buildPlainTextContent(
        'Restablece tu contraseña',
        "Hola {$name},\n\n" .
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta en ProveedorConecta Nicaragua.\n\n" .
        "Restablece tu contraseña en: {$resetUrl}\n\n" .
        "Este enlace expira en 1 hora por seguridad.\n\n" .
        "Si no solicitaste restablecer tu contraseña, puedes ignorar este correo."
    );

    try {
        $mail = createMailer();
        $mail->addAddress($email, $name);
        $mail->Subject = 'ProveedorConecta - Restablece tu contraseña';
        $mail->Body = $htmlContent;
        $mail->AltBody = $textContent;
        $mail->isHTML(true);

        $config = getEmailConfig();

        // If SMTP is not configured, simulate success
        if (empty($config['username']) || empty($config['password'])) {
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'message' => 'Email de restablecimiento enviado (simulado - SMTP no configurado)',
                    'email' => $email,
                    'token' => substr($token, 0, 8) . '...',
                    'resetUrl' => $resetUrl,
                    'mode' => 'simulation',
                ],
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $mail->send();

        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'message' => 'Email de restablecimiento enviado exitosamente',
                'email' => $email,
                'mode' => 'live',
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json');

    } catch (Exception $e) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'Error al enviar el email: ' . $e->getMessage(),
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
});

// Run the app
$app->run();
