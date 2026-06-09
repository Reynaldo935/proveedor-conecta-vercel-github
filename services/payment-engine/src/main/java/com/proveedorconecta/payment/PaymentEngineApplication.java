package com.proveedorconecta.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ProveedorConecta Payment Engine Application.
 *
 * Spring Boot application for processing payments with 3% commission
 * for the ProveedorConecta Nicaragua B2B marketplace platform.
 */
@SpringBootApplication
public class PaymentEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentEngineApplication.class, args);
    }
}
