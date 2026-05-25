package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

import java.math.BigDecimal;

public class DailyCashInflowPoint {
    private final int day;
    private final BigDecimal amount;

    public DailyCashInflowPoint(int day, BigDecimal amount) {
        this.day = day;
        this.amount = amount;
    }

    public int getDay() { return day; }
    public BigDecimal getAmount() { return amount; }
}
