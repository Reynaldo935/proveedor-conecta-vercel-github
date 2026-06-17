package com.proveedorconecta.payment.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Payment request model for processing payments.
 */
public class PaymentRequest {

    @JsonProperty("amount")
    private double amount;

    @JsonProperty("currency")
    private String currency = "NIO";

    @JsonProperty("buyerId")
    private String buyerId;

    @JsonProperty("sellerId")
    private String sellerId;

    @JsonProperty("productId")
    private String productId;

    @JsonProperty("description")
    private String description;

    @JsonProperty("paymentMethod")
    private String paymentMethod = "billetera";

    public PaymentRequest() {
    }

    // Getters and Setters
    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(String buyerId) {
        this.buyerId = buyerId;
    }

    public String getSellerId() {
        return sellerId;
    }

    public void setSellerId(String sellerId) {
        this.sellerId = sellerId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    /**
     * Validates the payment request.
     *
     * @return Error message if invalid, null if valid
     */
    public String validate() {
        if (amount <= 0) {
            return "El monto debe ser mayor que cero";
        }
        if (amount > 1000000) {
            return "El monto excede el límite máximo de C$1,000,000";
        }
        if (buyerId == null || buyerId.trim().isEmpty()) {
            return "El ID del comprador es requerido";
        }
        if (sellerId == null || sellerId.trim().isEmpty()) {
            return "El ID del vendedor es requerido";
        }
        if (buyerId.equals(sellerId)) {
            return "El comprador y vendedor no pueden ser el mismo";
        }
        return null;
    }
}
