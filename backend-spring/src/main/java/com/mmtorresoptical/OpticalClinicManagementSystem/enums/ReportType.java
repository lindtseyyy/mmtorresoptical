package com.mmtorresoptical.OpticalClinicManagementSystem.enums;

public enum ReportType {
    INVENTORY_LOW_STOCK,
    INVENTORY_OVERSTOCK,
    INVENTORY_TOP_SELLING,
    INVENTORY_ANALYTICS,
    TRANSACTIONS,
    PATIENTS;

    public String getDisplayTitle() {
        if (this == INVENTORY_ANALYTICS) {
            return "Comprehensive Inventory Analytics";
        }

        return toTitleCase(name());
    }

    public String getFilenamePrefix() {
        return getDisplayTitle();
    }

    public boolean supportsExcel() {
        return this != INVENTORY_ANALYTICS;
    }

    private static String toTitleCase(String enumName) {
        String[] parts = enumName.toLowerCase().split("_");
        StringBuilder builder = new StringBuilder();

        for (int index = 0; index < parts.length; index++) {
            String part = parts[index];
            if (part.isEmpty()) {
                continue;
            }

            if (builder.length() > 0) {
                builder.append(' ');
            }

            builder.append(Character.toUpperCase(part.charAt(0)));
            if (part.length() > 1) {
                builder.append(part.substring(1));
            }
        }

        return builder.toString();
    }
}
