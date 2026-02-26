package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.user;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UserAuditDTO {

    private UUID userId;
    private String firstName;
    private String middleName;
    private String lastName;
    private String gender;
    private LocalDate birthDate;
    private String email;
    private String contactNumber;
    private String username;
    private String role;
    private Boolean isArchived = false;
}