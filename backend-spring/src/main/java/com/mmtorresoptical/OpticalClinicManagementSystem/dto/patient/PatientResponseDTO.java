package com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PatientResponseDTO {
    private UUID patientId;
    private String firstName;
    private String middleName;
    private String lastName;
    private String gender;
    private String contactNumber;
    private String email;
    private LocalDate birthDate;
    private String address;
    private Boolean isArchived;
    private LocalDateTime createdAt;
}
