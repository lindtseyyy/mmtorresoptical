package com.mmtorresoptical.OpticalClinicManagementSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class VerifySecurityAnswerRequestDTO {

    @Email(message = "Email must be valid")
    @NotEmpty(message = "Email is required")
    private String email;

    @NotEmpty(message = "Security answer is required")
    private String securityAnswer;
}