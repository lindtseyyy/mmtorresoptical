package com.mmtorresoptical.OpticalClinicManagementSystem.dto.auth;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EnforcePasswordChangeRequestDTO {

    @NotEmpty(message = "New password is required")
    @Size(min = 8, message = "New password must be at least 8 characters")
    private String newPassword;
}
