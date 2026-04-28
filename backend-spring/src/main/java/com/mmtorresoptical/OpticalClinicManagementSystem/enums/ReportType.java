package com.mmtorresoptical.OpticalClinicManagementSystem.enums;

public enum ReportType {
    INVENTORY_LOW_STOCK,
    INVENTORY_OVERSTOCK,
    INVENTORY_TOP_SELLING,
    INVENTORY_ANALYTICS,
    TRANSACTIONS,
    PRESCRIPTIONS,
    PATIENTS,
    SALES_SUMMARY;

    public boolean supportsExcel() {
        return this != INVENTORY_ANALYTICS;
    }
}
