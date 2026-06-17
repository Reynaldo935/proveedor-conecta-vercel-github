package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// ValidationResult represents a validation check result
type ValidationResult struct {
	Valid   bool   `json:"valid"`
	Number  string `json:"number"`
	Type    string `json:"type"`
	Message string `json:"message"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

func main() {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", corsMiddleware(healthHandler))

	// Validation endpoints
	mux.HandleFunc("/api/validate/luhn", corsMiddleware(luhnHandler))
	mux.HandleFunc("/api/validate/cedula", corsMiddleware(cedulaHandler))
	mux.HandleFunc("/api/validate/phone", corsMiddleware(phoneHandler))
	mux.HandleFunc("/api/validate/account", corsMiddleware(accountHandler))

	port := ":8080"
	log.Printf("Validation Service starting on port %s", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// corsMiddleware adds CORS headers to all responses
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Content-Type", "application/json")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(HealthResponse{
		Status:  "healthy",
		Service: "validation-service",
		Version: "1.0.0",
	})
}

func luhnHandler(w http.ResponseWriter, r *http.Request) {
	number := r.URL.Query().Get("number")
	if number == "" {
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Error:   "number parameter is required",
		})
		return
	}

	// Remove spaces and dashes
	cleaned := strings.ReplaceAll(number, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")

	valid := luhnCheck(cleaned)

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Data: ValidationResult{
			Valid:   valid,
			Number:  maskNumber(cleaned),
			Type:    "luhn",
			Message: getLuhnMessage(valid, cleaned),
		},
	})
}

func cedulaHandler(w http.ResponseWriter, r *http.Request) {
	number := r.URL.Query().Get("number")
	if number == "" {
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Error:   "number parameter is required",
		})
		return
	}

	// Remove spaces and dashes
	cleaned := strings.ReplaceAll(number, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")

	valid, msg := validateCedula(cleaned)

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Data: ValidationResult{
			Valid:   valid,
			Number:  cleaned,
			Type:    "cedula",
			Message: msg,
		},
	})
}

func phoneHandler(w http.ResponseWriter, r *http.Request) {
	number := r.URL.Query().Get("number")
	if number == "" {
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Error:   "number parameter is required",
		})
		return
	}

	// Remove spaces, dashes, and country code prefix
	cleaned := strings.ReplaceAll(number, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.TrimPrefix(cleaned, "+505")
	cleaned = strings.TrimPrefix(cleaned, "505")

	valid, msg := validatePhone(cleaned)

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Data: ValidationResult{
			Valid:   valid,
			Number:  cleaned,
			Type:    "phone",
			Message: msg,
		},
	})
}

func accountHandler(w http.ResponseWriter, r *http.Request) {
	number := r.URL.Query().Get("number")
	if number == "" {
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Error:   "number parameter is required",
		})
		return
	}

	cleaned := strings.ReplaceAll(number, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")

	valid, msg := validateAccount(cleaned)

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Data: ValidationResult{
			Valid:   valid,
			Number:  maskNumber(cleaned),
			Type:    "account",
			Message: msg,
		},
	})
}

// luhnCheck implements the Luhn algorithm for validating credit card numbers
func luhnCheck(number string) bool {
	if len(number) < 13 || len(number) > 19 {
		return false
	}

	// Check all digits
	for _, c := range number {
		if c < '0' || c > '9' {
			return false
		}
	}

	sum := 0
	nDigits := len(number)
	parity := nDigits % 2

	for i := 0; i < nDigits; i++ {
		digit, _ := strconv.Atoi(string(number[i]))

		if i%2 == parity {
			digit *= 2
			if digit > 9 {
				digit -= 9
			}
		}
		sum += digit
	}

	return sum%10 == 0
}

// validateCedula validates a Nicaraguan cédula number
// Nicaraguan cédula format: 13 digits with municipality code (001-580)
func validateCedula(number string) (bool, string) {
	if len(number) != 13 {
		return false, fmt.Sprintf("La cédula debe tener exactamente 13 dígitos, tiene %d", len(number))
	}

	// Check all digits
	for _, c := range number {
		if c < '0' || c > '9' {
			return false, "La cédula solo debe contener números"
		}
	}

	// Validate municipality code (first 3 digits: 001-580)
	municipalityCode, _ := strconv.Atoi(number[0:3])
	if municipalityCode < 1 || municipalityCode > 580 {
		return false, fmt.Sprintf("Código de municipio inválido: %d (debe ser 001-580)", municipalityCode)
	}

	// Validate birth date section (digits 4-9: YYMMDD)
	year, _ := strconv.Atoi(number[3:5])
	month, _ := strconv.Atoi(number[5:7])
	day, _ := strconv.Atoi(number[7:9])

	if month < 1 || month > 12 {
		return false, fmt.Sprintf("Mes inválido: %d (debe ser 01-12)", month)
	}

	daysInMonth := []int{31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}
	if day < 1 || day > daysInMonth[month-1] {
		return false, fmt.Sprintf("Día inválido: %d para el mes %d", day, month)
	}

	// Year should be reasonable (00-99 covers 1900-1999 and 2000-2099)
	if year > 99 {
		return false, "Año inválido en la cédula"
	}

	return true, "Cédula nicaragüense válida"
}

// validatePhone validates a Nicaraguan phone number
// Format: 8 digits, starts with 5, 7, or 8
func validatePhone(number string) (bool, string) {
	if len(number) != 8 {
		return false, fmt.Sprintf("El teléfono debe tener exactamente 8 dígitos, tiene %d", len(number))
	}

	// Check all digits
	for _, c := range number {
		if c < '0' || c > '9' {
			return false, "El teléfono solo debe contener números"
		}
	}

	// Check first digit
	firstDigit := number[0]
	if firstDigit != '5' && firstDigit != '7' && firstDigit != '8' {
		return false, fmt.Sprintf("El teléfono debe empezar con 5, 7 u 8, empieza con %c", firstDigit)
	}

	// Identify carrier
	carrier := getCarrier(firstDigit)

	return true, fmt.Sprintf("Teléfono nicaragüense válido (%s)", carrier)
}

// validateAccount validates a bank account number
// Nicaraguan bank accounts: typically 9-16 digits depending on bank
func validateAccount(number string) (bool, string) {
	if len(number) < 9 || len(number) > 16 {
		return false, fmt.Sprintf("La cuenta bancaria debe tener entre 9 y 16 dígitos, tiene %d", len(number))
	}

	// Check all digits
	for _, c := range number {
		if c < '0' || c > '9' {
			return false, "La cuenta bancaria solo debe contener números"
		}
	}

	// Try to identify the bank
	bank := identifyBank(number)

	return true, fmt.Sprintf("Cuenta bancaria válida%s", bank)
}

// getCarrier returns the carrier name based on the first digit
func getCarrier(firstDigit byte) string {
	switch firstDigit {
	case '5':
		return "Claro"
	case '7':
		return "Movistar"
	case '8':
		return "CooTel/Telefonica"
	default:
		return "Desconocido"
	}
}

// identifyBank attempts to identify the bank from the account number prefix
func identifyBank(number string) string {
	if len(number) < 3 {
		return ""
	}

	prefix := number[0:3]

	bankPrefixes := map[string]string{
		"100": "Banco Central de Nicaragua",
		"101": "BanPro",
		"102": "BAC Credomatic",
		"103": "Banco de la Producción (BANPRO)",
		"104": "Banco de America Central (BAC)",
		"105": "Banco Lafise",
		"106": "Banco de Finanzas",
		"107": "Banco Ficohsa",
		"108": "Banco Avval",
	}

	if bank, ok := bankPrefixes[prefix]; ok {
		return fmt.Sprintf(" - %s", bank)
	}

	return ""
}

// maskNumber masks all but the last 4 digits of a number
func maskNumber(number string) string {
	if len(number) <= 4 {
		return number
	}
	return strings.Repeat("*", len(number)-4) + number[len(number)-4:]
}

// getLuhnMessage returns a descriptive message for the Luhn check result
func getLuhnMessage(valid bool, number string) string {
	if !valid {
		if len(number) < 13 || len(number) > 19 {
			return fmt.Sprintf("Número de tarjeta inválido: debe tener entre 13 y 19 dígitos (tiene %d)", len(number))
		}
		return "Número de tarjeta inválido (falló la verificación Luhn)"
	}

	// Identify card type
	cardType := identifyCardType(number)
	return fmt.Sprintf("Número de tarjeta válido (%s)", cardType)
}

// identifyCardType identifies the card type from the number prefix
func identifyCardType(number string) string {
	if len(number) == 0 {
		return "Desconocido"
	}

	if number[0] == '4' {
		return "Visa"
	}

	if len(number) >= 2 {
		prefix2 := number[0:2]
		if prefix2 == "51" || prefix2 == "52" || prefix2 == "53" || prefix2 == "54" || prefix2 == "55" {
			return "Mastercard"
		}
		if prefix2 == "34" || prefix2 == "37" {
			return "American Express"
		}
		if prefix2 == "36" || prefix2 == "38" || prefix2 == "30" {
			return "Diners Club"
		}
	}

	if len(number) >= 4 {
		prefix4 := number[0:4]
		if prefix4 == "6011" || number[0:2] == "65" {
			return "Discover"
		}
	}

	if number[0:3] == "300" || number[0:3] == "305" {
		return "Diners Club"
	}

	return "Desconocida"
}
