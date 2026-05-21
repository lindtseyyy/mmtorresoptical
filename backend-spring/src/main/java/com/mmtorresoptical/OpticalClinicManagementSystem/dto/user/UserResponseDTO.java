package com.mmtorresoptical.OpticalClinicManagementSystem.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserResponseDTO {

    private UUID userId;
    private String firstName;
    private String middleName; // Optional
    private String lastName;
    private String sex;
    private LocalDate birthDate;
    private String email;
    private String contactNumber;
    private String username;
    private String role; // "Admin" or "Staff"
    private Boolean isArchived = false;
    @JsonProperty("isPwChangeRequired")
    private boolean isPwChangeRequired;
    private String securityQuestion;
    private LocalDateTime createdAt;

}