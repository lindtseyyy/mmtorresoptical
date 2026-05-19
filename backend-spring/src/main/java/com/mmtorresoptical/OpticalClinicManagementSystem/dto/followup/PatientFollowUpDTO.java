package com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PatientFollowUpDTO {
    private UUID followUpId;
    private UUID prescriptionId;
    private UUID patientId;
    private LocalDate scheduledDate;
    private LocalDate actualVisitDate;
    private String status;
    private String followUpReason;
    private LocalDateTime createdAt;
    private UserSummaryDTO createdBy;
}
