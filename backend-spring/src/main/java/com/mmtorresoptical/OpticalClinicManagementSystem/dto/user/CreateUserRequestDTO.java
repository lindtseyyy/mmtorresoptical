package com.mmtorresoptical.OpticalClinicManagementSystem.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

// Using lombok to reduce boilerplate. Add <dependency> for lombok if not present.
import lombok.Data;

@Data
public class CreateUserRequestDTO {

    @NotEmpty(message = "First name is required")
    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]+$", message = "Name contains invalid characters")
    private String firstName;

    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L}\\s.'-]+$", message = "Name contains invalid characters")
    private String middleName; // Optional

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

    @NotEmpty(message = "Username is required")
    @Size(min = 3, message = "Username must be at least 3 characters")
    private String username;

    // Password is NOT @NotEmpty because it's optional during an update
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?`~]).*$",
             message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
    private String password;

    @NotEmpty(message = "Role is required")
    private String role; // "Admin" or "Staff"

    private Boolean isArchived = false;
}