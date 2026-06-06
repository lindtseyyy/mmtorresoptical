package com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient;

import lombok.Data;

import java.util.UUID;

@Data
public class PatientSearchResultDTO {
    private UUID patientId;
    private String fullName;
    private String contactNumber;
    private String email;
}
