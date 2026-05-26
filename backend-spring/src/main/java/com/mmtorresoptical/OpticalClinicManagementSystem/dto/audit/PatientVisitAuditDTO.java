package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PatientVisitAuditDTO {
    private UUID visitId;
    private UUID patientId;
    private LocalDateTime visitTimestamp;
    private String purpose;
    private String notes;
    private UUID loggedByUserId;
}
