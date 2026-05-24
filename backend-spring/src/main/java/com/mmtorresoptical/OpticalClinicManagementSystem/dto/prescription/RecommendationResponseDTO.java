package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import java.math.BigDecimal;
import java.util.UUID;

public record RecommendationResponseDTO(
        UUID id,
        UUID productId,
        String productName,
        String category,
        String supplier,
        String imageDir,
        String productType,
        BigDecimal unitPrice,
        int stockQuantity,
        int quantity,
        String staffNotes
) {}
