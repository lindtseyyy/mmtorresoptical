package com.mmtorresoptical.OpticalClinicManagementSystem.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateOwnProfileRequestDTO {

    @NotEmpty(message = "First name is required")
    private String firstName;

    private String middleName;

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
}
