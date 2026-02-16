package com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
public class PatientDetailsDTO {
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

    // Foreign keys / Child data
    private Set<Prescription> prescriptions;
    private Set<HealthHistoryDetailsDTO> healthHistory;
    private List<Transaction> transactions;
}
