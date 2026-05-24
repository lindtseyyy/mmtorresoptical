package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreatePrescriptionRequestDTO {

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;
    private String notes;
    private Boolean isArchived = false;
    private LocalDate followUpScheduledDate;
    private String followUpReason;

    private UUID eyeExamId;

    private List<LensSpecificationDTO> lensSpecifications;

    private List<RecommendationItemDTO> products;
}
