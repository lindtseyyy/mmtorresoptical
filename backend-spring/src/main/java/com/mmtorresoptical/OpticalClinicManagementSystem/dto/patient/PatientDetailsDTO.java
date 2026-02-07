package com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient;

import java.time.LocalDate;
import java.util.UUID;

public class PatientDetailsDTO {
    private UUID patientId;
    private String firstName;
    private String lastName;
    private String gender;
    private String contactNumber;
    private String email;
    private LocalDate birthDate;
    private String address;
}
