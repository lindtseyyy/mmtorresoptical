package com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PatientRequestDTO {

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]+$", message = "Name contains invalid characters")
    private String firstName;

    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]*$", message = "Name contains invalid characters")
    private String middleName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]+$", message = "Name contains invalid characters")
    private String lastName;

    @NotBlank(message = "Sex is required")
    private String sex;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^09\\d{9}$", message = "Must start with 09 and be exactly 11 digits")
    private String contactNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    @NotNull(message = "Birth date is required")
    private LocalDate birthDate;

    @NotBlank(message = "Address is required")
    @Size(max = 255)
    private String address;

    private String medicalHistory;

    private Boolean isArchived = false;
}

