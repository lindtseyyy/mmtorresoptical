package com.mmtorresoptical.OpticalClinicManagementSystem.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class LoginRequestDTO {
    @NotEmpty(message = "Username or email is required")
    private String loginIdentifier; // Will be username or email

    @NotEmpty(message = "Password is required")
    private String password;
}