package com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateHealthHistoryRequestDTO {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    @NotNull(message = "Exam date is required")
    private LocalDate examDate;

    private String eyeConditions;

    private String systemicConditions;

    private String medications;

    private String allergies;

    private String visualAcuityRight;

    private String visualAcuityLeft;

    private String notes;

    private Boolean isArchived = false;
}