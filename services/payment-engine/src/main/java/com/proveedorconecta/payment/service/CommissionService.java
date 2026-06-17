package com.proveedorconecta.payment.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Commission calculation service for ProveedorConecta.
 *
 * Handles the 3% platform commission calculation with proper
 * decimal precision for Nicaraguan córdobas (NIO).
 *
 * Commission structure:
 * - Platform commission: 3% of transaction amount
 * - Seller payout: 97% of transaction amount
 */
@Service
public class CommissionService {

    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.03");
    private static final BigDecimal SELLER_RATE = new BigDecimal("0.97");
    private static final int DECIMAL_SCALE = 2;

    /**
     * Calculate the platform commission (3%) for a given amount.
     *
     * @param amount The transaction amount
     * @return The commission amount rounded to 2 decimal places
     */
    public double calculateCommission(double amount) {
        if (amount <= 0) {
            return 0.0;
        }
        BigDecimal amountBD = BigDecimal.valueOf(amount);
        BigDecimal commission = amountBD.multiply(COMMISSION_RATE)
                .setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
        return commission.doubleValue();
    }

    /**
     * Calculate the seller payout (97%) for a given amount.
     *
     * @param amount The transaction amount
     * @return The seller payout amount rounded to 2 decimal places
     */
    public double calculateSellerPayout(double amount) {
        if (amount <= 0) {
            return 0.0;
        }
        BigDecimal amountBD = BigDecimal.valueOf(amount);
        BigDecimal payout = amountBD.multiply(SELLER_RATE)
                .setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
        return payout.doubleValue();
    }

    /**
     * Calculate commission breakdown for a given amount.
     *
     * @param amount The transaction amount
     * @return CommissionBreakdown with all values
     */
    public CommissionBreakdown calculateBreakdown(double amount) {
        return new CommissionBreakdown(
                amount,
                calculateCommission(amount),
                calculateSellerPayout(amount),
                COMMISSION_RATE.doubleValue(),
                SELLER_RATE.doubleValue()
        );
    }

    /**
     * Get the current commission rate.
     *
     * @return The commission rate (0.03 = 3%)
     */
    public double getCommissionRate() {
        return COMMISSION_RATE.doubleValue();
    }

    /**
     * Verify that commission + payout equals the original amount.
     *
     * @param amount      The original amount
     * @param commission  The calculated commission
     * @param sellerPayout The calculated seller payout
     * @return true if the amounts add up correctly
     */
    public boolean verifyIntegrity(double amount, double commission, double sellerPayout) {
        BigDecimal total = BigDecimal.valueOf(commission)
                .add(BigDecimal.valueOf(sellerPayout))
                .setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
        BigDecimal original = BigDecimal.valueOf(amount)
                .setScale(DECIMAL_SCALE, RoundingMode.HALF_UP);
        return total.compareTo(original) == 0;
    }

    /**
     * Commission breakdown record.
     */
    public static class CommissionBreakdown {
        private final double originalAmount;
        private final double commission;
        private final double sellerPayout;
        private final double commissionRate;
        private final double sellerRate;

        public CommissionBreakdown(double originalAmount, double commission,
                                    double sellerPayout, double commissionRate, double sellerRate) {
            this.originalAmount = originalAmount;
            this.commission = commission;
            this.sellerPayout = sellerPayout;
            this.commissionRate = commissionRate;
            this.sellerRate = sellerRate;
        }

        public double getOriginalAmount() { return originalAmount; }
        public double getCommission() { return commission; }
        public double getSellerPayout() { return sellerPayout; }
        public double getCommissionRate() { return commissionRate; }
        public double getSellerRate() { return sellerRate; }
    }
}
