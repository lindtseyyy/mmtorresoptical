package com.mmtorresoptical.OpticalClinicManagementSystem.dto.user;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetSecurityCredentialsRequestDTO {

    @NotEmpty(message = "New security question is required")
    private String newSecurityQuestion;

    @NotEmpty(message = "New security answer is required")
    @Size(min = 3, message = "New security answer must be at least 3 characters")
    private String newSecurityAnswer;
}
