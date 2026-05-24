package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import java.util.List;

public record PrescriptionRecommendationsDTO(
        List<LensSpecificationDTO> lensSpecifications,
        List<RecommendationItemDTO> items
) {}
