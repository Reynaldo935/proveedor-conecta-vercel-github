<?php
/**
 * ProveedorConecta Nicaragua — Supabase PostgreSQL Connection
 * 
 * Archivo de conexión a Supabase PostgreSQL como base de datos secundaria.
 * La base de datos PRIMARIA sigue siendo Turso (SQLite) a través de Prisma.
 * 
 * USO: Incluir este archivo en cualquier endpoint PHP que necesite
 * acceder directamente a la base de datos PostgreSQL en Supabase.
 * 
 * URL del proyecto Supabase: https://supabase.com/dashboard/project/abxxkpzkfdmrmjinrtff
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// ─── Configuración de Supabase ─────────────────────────────────────────────
define('SUPABASE_URL', 'https://abxxkpzkfdmrmjinrtff.supabase.co');
define('SUPABASE_DB_HOST', 'db.abxxkpzkfdmrmjinrtff.supabase.co');
define('SUPABASE_DB_PORT', '5432');
define('SUPABASE_DB_NAME', 'postgres');
define('SUPABASE_DB_USER', 'postgres');
define('SUPABASE_DB_PASS', 'losturcapanda');

// ─── Función de conexión ──────────────────────────────────────────────────
function getSupabaseConnection() {
    $conn_string = sprintf(
        "host=%s port=%s dbname=%s user=%s password=%s",
        SUPABASE_DB_HOST,
        SUPABASE_DB_PORT,
        SUPABASE_DB_NAME,
        SUPABASE_DB_USER,
        SUPABASE_DB_PASS
    );
    
    $conn = pg_connect($conn_string);
    
    if (!$conn) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error de conexión a Supabase PostgreSQL'
        ]);
        exit;
    }
    
    return $conn;
}

// ─── Endpoint de prueba ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['action'])) {
    echo json_encode([
        'success' => true,
        'message' => 'ProveedorConecta Nicaragua — Supabase PostgreSQL Connection',
        'supabase_url' => SUPABASE_URL,
        'database' => SUPABASE_DB_NAME,
        'host' => SUPABASE_DB_HOST,
        'status' => 'Configured'
    ]);
    exit;
}

// ─── Endpoint: Probar conexión ────────────────────────────────────────────
if ($_GET['action'] === 'test') {
    try {
        $conn = getSupabaseConnection();
        $result = pg_query($conn, 'SELECT NOW() as current_time, version() as pg_version');
        $row = pg_fetch_assoc($result);
        
        echo json_encode([
            'success' => true,
            'message' => 'Conexión exitosa a Supabase PostgreSQL',
            'server_time' => $row['current_time'],
            'version' => $row['pg_version']
        ]);
        
        pg_close($conn);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ─── Endpoint: Ejecutar query ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $query = $input['query'] ?? '';
    
    if (empty($query)) {
        echo json_encode([
            'success' => false,
            'message' => 'Query es requerido'
        ]);
        exit;
    }
    
    try {
        $conn = getSupabaseConnection();
        $result = pg_query($conn, $query);
        
        if (!$result) {
            echo json_encode([
                'success' => false,
                'message' => 'Error en query: ' . pg_last_error($conn)
            ]);
            pg_close($conn);
            exit;
        }
        
        $rows = [];
        while ($row = pg_fetch_assoc($result)) {
            $rows[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Query ejecutado correctamente',
            'data' => $rows,
            'rowCount' => count($rows)
        ]);
        
        pg_close($conn);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    exit;
}
