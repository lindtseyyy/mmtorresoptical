package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import java.util.UUID;

public record RecommendationItemDTO(
        UUID productId,
        int quantity,
        String staffNotes
) {}
