package com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VoidEyeExamRequestDTO {
    @NotBlank(message = "Void reason is required")
    private String voidReason;
}
