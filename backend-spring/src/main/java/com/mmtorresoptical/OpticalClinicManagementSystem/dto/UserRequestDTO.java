package com.mmtorresoptical.OpticalClinicManagementSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

// Using lombok to reduce boilerplate. Add <dependency> for lombok if not present.
import lombok.Data;

@Data
public class UserRequestDTO {

    @NotEmpty(message = "First name is required")
    private String firstName;

    private String middleName; // Optional

    @NotEmpty(message = "Last name is required")
    private String lastName;

    @NotEmpty(message = "Gender is required")
    private String gender;

    @NotNull(message = "Birth date is required")
    private LocalDate birthDate;

    @NotEmpty(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotEmpty(message = "Contact number is required")
    @Size(min = 10, message = "Contact number must be at least 10 digits")
    private String contactNumber;

    @NotEmpty(message = "Username is required")
    @Size(min = 3, message = "Username must be at least 3 characters")
    private String username;

    // Password is NOT @NotEmpty because it's optional during an update
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotEmpty(message = "Role is required")
    private String role; // "Admin" or "Staff"

    private Boolean isArchived = false;
}