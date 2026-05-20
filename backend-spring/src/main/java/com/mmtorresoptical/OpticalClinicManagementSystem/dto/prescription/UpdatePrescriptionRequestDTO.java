package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdatePrescriptionRequestDTO {

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;
    private String notes;

}
