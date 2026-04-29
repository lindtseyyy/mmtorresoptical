package com.mmtorresoptical.OpticalClinicManagementSystem.dto.backup;

import jakarta.validation.constraints.NotBlank;

public record BackupRequestDTO(
        @NotBlank(message = "Current password is required")
        String currentPassword
) {}
