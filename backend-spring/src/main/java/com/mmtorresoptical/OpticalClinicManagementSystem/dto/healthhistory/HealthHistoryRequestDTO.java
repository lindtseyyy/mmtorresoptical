package com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class HealthHistoryRequestDTO {

    private UUID patientId;
    private LocalDate examDate;
    private String eyeConditions;
    private String systemicConditions;
    private String medications;
    private String allergies;
    private String visualAcuityRight;
    private String visualAcuityLeft;
    private String notes;

}