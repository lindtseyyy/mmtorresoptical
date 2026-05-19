package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VoidPrescriptionRequestDTO {
    @NotBlank(message = "Void reason is required")
    private String voidReason;
}
