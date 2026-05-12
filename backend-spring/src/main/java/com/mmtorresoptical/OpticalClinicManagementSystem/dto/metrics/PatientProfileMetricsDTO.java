package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PatientProfileMetricsDTO {
    private long totalVisits;
    private LocalDateTime lastVisitDate;
    private LocalDateTime lastPrescriptionDate;
    private long purchasedProducts;
    private BigDecimal totalAmountPurchased;

    public PatientProfileMetricsDTO(long totalVisits, LocalDateTime lastVisitDate,
                                     LocalDateTime lastPrescriptionDate, long purchasedProducts,
                                     BigDecimal totalAmountPurchased) {
        this.totalVisits = totalVisits;
        this.lastVisitDate = lastVisitDate;
        this.lastPrescriptionDate = lastPrescriptionDate;
        this.purchasedProducts = purchasedProducts;
        this.totalAmountPurchased = totalAmountPurchased;
    }

    public long getTotalVisits() { return totalVisits; }
    public LocalDateTime getLastVisitDate() { return lastVisitDate; }
    public LocalDateTime getLastPrescriptionDate() { return lastPrescriptionDate; }
    public long getPurchasedProducts() { return purchasedProducts; }
    public BigDecimal getTotalAmountPurchased() { return totalAmountPurchased; }
}
