package com.mmtorresoptical.OpticalClinicManagementSystem.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateOwnProfileRequestDTO {

    @NotEmpty(message = "First name is required")
    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]+$", message = "Name contains invalid characters")
    private String firstName;

    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]+$", message = "Name contains invalid characters")
    private String middleName;

    @NotEmpty(message = "Last name is required")
    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]+$", message = "Name contains invalid characters")
    private String lastName;

    @NotEmpty(message = "Sex is required")
    private String sex;

    @NotNull(message = "Birth date is required")
    private LocalDate birthDate;

    @NotEmpty(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotEmpty(message = "Contact number is required")
    @Pattern(regexp = "^09\\d{9}$", message = "Must start with 09 and be exactly 11 digits")
    private String contactNumber;
}
