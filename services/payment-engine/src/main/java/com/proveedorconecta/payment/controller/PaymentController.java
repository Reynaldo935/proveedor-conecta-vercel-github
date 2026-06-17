package com.proveedorconecta.payment.controller;

import com.proveedorconecta.payment.model.PaymentRequest;
import com.proveedorconecta.payment.model.PaymentResponse;
import com.proveedorconecta.payment.service.CommissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for payment processing.
 *
 * Provides endpoints for:
 * - Processing payments with 3% commission split
 * - Calculating commission for a given amount
 * - Health check
 */
@RestController
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    private final CommissionService commissionService;

    public PaymentController(CommissionService commissionService) {
        this.commissionService = commissionService;
    }

    /**
     * Process a payment with 3% commission split.
     *
     * POST /api/payments/process
     *
     * Request body:
     * {
     *   "amount": 1000.00,
     *   "currency": "NIO",
     *   "buyerId": "user-123",
     *   "sellerId": "seller-456",
     *   "productId": "prod-789",
     *   "description": "Cemento Portland x10",
     *   "paymentMethod": "billetera"
     * }
     */
    @PostMapping("/api/payments/process")
    public ResponseEntity<Map<String, Object>> processPayment(
            @RequestBody PaymentRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId) {

        logger.info("Processing payment: amount={}, buyer={}, seller={}",
                request.getAmount(), request.getBuyerId(), request.getSellerId());

        // Validate the request
        String validationError = request.validate();
        if (validationError != null) {
            logger.warn("Payment validation failed: {}", validationError);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", validationError
            ));
        }

        try {
            // Process the payment with commission split
            PaymentResponse response = PaymentResponse.success(request, commissionService);

            // Verify integrity (commission + payout = amount)
            boolean valid = commissionService.verifyIntegrity(
                    response.getAmount(),
                    response.getCommission(),
                    response.getSellerPayout()
            );

            if (!valid) {
                logger.error("Payment integrity check failed for amount: {}", request.getAmount());
                return ResponseEntity.internalServerError().body(Map.of(
                        "success", false,
                        "error", "Error de integridad en el cálculo de comisión"
                ));
            }

            logger.info("Payment processed successfully: transactionId={}, commission={}",
                    response.getTransactionId(), response.getCommission());

            return ResponseEntity.ok(Map.of(
                    "success", response.isSuccess(),
                    "data", response
            ));

        } catch (Exception e) {
            logger.error("Payment processing error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Error interno del procesador de pagos"
            ));
        }
    }

    /**
     * Calculate commission for a given amount without processing a payment.
     *
     * POST /api/payments/commission
     *
     * Request body:
     * {
     *   "amount": 1000.00
     * }
     */
    @PostMapping("/api/payments/commission")
    public ResponseEntity<Map<String, Object>> calculateCommission(
            @RequestBody Map<String, Object> body) {

        Object amountObj = body.get("amount");
        if (amountObj == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El campo 'amount' es requerido"
            ));
        }

        double amount;
        try {
            amount = Double.parseDouble(amountObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El campo 'amount' debe ser un número válido"
            ));
        }

        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El monto debe ser mayor que cero"
            ));
        }

        PaymentResponse response = PaymentResponse.commissionCalculation(amount, commissionService);

        return ResponseEntity.ok(Map.of(
                "success", response.isSuccess(),
                "data", response
        ));
    }

    /**
     * Health check endpoint.
     *
     * GET /api/payments/health
     */
    @GetMapping("/api/payments/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "service", "payment-engine",
                "version", "1.0.0",
                "commissionRate", commissionService.getCommissionRate()
        ));
    }
}
