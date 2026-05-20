package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.followup;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PatientFollowUpAuditDTO {

    private UUID followUpId;
    private UUID patientId;
    private String patientName;
    private UUID prescriptionId;
    private UUID eyeExamId;
    private LocalDate scheduledDate;
    private LocalDate actualVisitDate;
    private String status;
    private String followUpReason;
    private Boolean isArchived;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdByUserId;
    private String createdByName;
    private String createdByRole;
}
