package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class PrescriptionResponseDTO {

    private UUID prescriptionId;
    private String rxNumber;
    private LocalDate issueDate;
    private String notes;
    private LocalDateTime createdAt;
    private Boolean isArchived;
    private String status;
    private UUID eyeExamId;
    private UserSummaryDTO createdBy;

    private List<PrescriptionItemResponseDTO> prescriptionItems;
}
