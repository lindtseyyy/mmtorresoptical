package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdatePrescriptionRequestDTO {

    @NotNull(message = "Exam date is required")
    private LocalDate examDate;
    private String notes;

}
