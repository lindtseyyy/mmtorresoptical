package com.mmtorresoptical.OpticalClinicManagementSystem.dto.visit;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PatientVisitDTO {
    private UUID visitId;
    private UUID patientId;
    private LocalDateTime visitTimestamp;
    private String purpose;
    private String notes;
    private UserSummaryDTO loggedBy;
}
