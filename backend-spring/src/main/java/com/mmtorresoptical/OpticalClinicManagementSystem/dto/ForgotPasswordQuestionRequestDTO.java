package com.mmtorresoptical.OpticalClinicManagementSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class ForgotPasswordQuestionRequestDTO {

    @Email(message = "Email must be valid")
    @NotEmpty(message = "Email is required")
    private String email;
}