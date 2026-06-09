package com.proveedorconecta.payment.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Payment response model with commission breakdown.
 */
public class PaymentResponse {

    @JsonProperty("success")
    private boolean success;

    @JsonProperty("transactionId")
    private String transactionId;

    @JsonProperty("amount")
    private double amount;

    @JsonProperty("commission")
    private double commission;

    @JsonProperty("sellerPayout")
    private double sellerPayout;

    @JsonProperty("commissionRate")
    private double commissionRate;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("status")
    private String status;

    @JsonProperty("buyerId")
    private String buyerId;

    @JsonProperty("sellerId")
    private String sellerId;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("message")
    private String message;

    public PaymentResponse() {
        this.transactionId = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now();
        this.commissionRate = 0.03;
    }

    // Static factory method for successful payment
    public static PaymentResponse success(PaymentRequest request, CommissionService commissionService) {
        PaymentResponse response = new PaymentResponse();
        response.success = true;
        response.amount = request.getAmount();
        response.commission = commissionService.calculateCommission(request.getAmount());
        response.sellerPayout = commissionService.calculateSellerPayout(request.getAmount());
        response.currency = request.getCurrency();
        response.status = "COMPLETED";
        response.buyerId = request.getBuyerId();
        response.sellerId = request.getSellerId();
        response.message = "Pago procesado exitosamente";
        return response;
    }

    // Static factory method for failed payment
    public static PaymentResponse failure(String errorMessage) {
        PaymentResponse response = new PaymentResponse();
        response.success = false;
        response.status = "FAILED";
        response.message = errorMessage;
        return response;
    }

    // Commission-only response
    public static PaymentResponse commissionCalculation(double amount, CommissionService commissionService) {
        PaymentResponse response = new PaymentResponse();
        response.success = true;
        response.amount = amount;
        response.commission = commissionService.calculateCommission(amount);
        response.sellerPayout = commissionService.calculateSellerPayout(amount);
        response.commissionRate = commissionService.getCommissionRate();
        response.status = "CALCULATED";
        response.message = "Cálculo de comisión exitoso";
        return response;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public double getCommission() {
        return commission;
    }

    public void setCommission(double commission) {
        this.commission = commission;
    }

    public double getSellerPayout() {
        return sellerPayout;
    }

    public void setSellerPayout(double sellerPayout) {
        this.sellerPayout = sellerPayout;
    }

    public double getCommissionRate() {
        return commissionRate;
    }

    public void setCommissionRate(double commissionRate) {
        this.commissionRate = commissionRate;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
