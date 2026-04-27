package com.mmtorresoptical.OpticalClinicManagementSystem.dto.user;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateSecurityCredentialsRequestDTO {

    @NotEmpty(message = "Current password is required")
    private String currentPassword;

    @NotEmpty(message = "Security question is required")
    private String securityQuestion;

    @NotEmpty(message = "Security answer is required")
    @Size(min = 3, message = "Security answer must be at least 3 characters")
    private String securityAnswer;
}
