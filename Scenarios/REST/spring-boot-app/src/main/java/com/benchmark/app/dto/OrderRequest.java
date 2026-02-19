package com.benchmark.app.dto;

import com.benchmark.app.entity.Order;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class OrderRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    // Constructors
    public OrderRequest() {
    }

    public OrderRequest(Long customerId, BigDecimal amount) {
        this.customerId = customerId;
        this.amount = amount;
    }

    // Convert to Entity
    public Order toEntity() {
        return new Order(customerId, amount);
    }

    // Getters and Setters
    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
