package com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserDTO;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class HealthHistoryResponseDTO {

    private UUID historyId;
    private LocalDate examDate;
    private String eyeConditions;
    private String systemicConditions;
    private String medications;
    private String allergies;
    private String visualAcuityRight;
    private String visualAcuityLeft;
    private String notes;
    private LocalDateTime createdAt;
    private Boolean isArchived;
    private UserDTO createdBy;
}