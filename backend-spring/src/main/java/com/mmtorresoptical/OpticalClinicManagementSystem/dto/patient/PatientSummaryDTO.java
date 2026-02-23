package com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient;

import lombok.Data;

import java.util.UUID;

@Data
public class PatientSummaryDTO {
    private UUID patientId;
    private String fullName;
}
