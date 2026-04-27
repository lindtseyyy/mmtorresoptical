package com.mmtorresoptical.OpticalClinicManagementSystem.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetRequestDTO {

    @Email(message = "Email must be valid")
    @NotEmpty(message = "Email is required")
    private String email;

    @NotEmpty(message = "Security answer is required")
    private String securityAnswer;

    @NotEmpty(message = "New password is required")
    @Size(min = 8, message = "New password must be at least 8 characters")
    private String newPassword;
}