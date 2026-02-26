package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescription;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class PrescriptionAuditDTO {

    private UUID prescriptionId;
    private LocalDate examDate;
    private String notes;
    private LocalDateTime createdAt;
    private Boolean isArchived;
    private UUID createdByUserId;

}