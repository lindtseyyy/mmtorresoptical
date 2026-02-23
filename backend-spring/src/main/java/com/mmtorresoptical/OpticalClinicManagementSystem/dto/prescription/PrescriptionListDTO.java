package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PrescriptionListDTO {

    private UUID prescriptionId;
    private LocalDate examDate;
    private String notes;
    private LocalDateTime createdAt;
    private Boolean isArchived;
    private UserSummaryDTO createdBy;

}
