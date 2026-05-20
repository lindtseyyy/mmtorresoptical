package com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateFollowUpRequestDTO {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    private String followUpReason;

    private UUID prescriptionId;

    private UUID eyeExamId;
}
