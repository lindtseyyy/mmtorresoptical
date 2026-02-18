package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemRequestDTO;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PrescriptionRequestDTO {

    @NotNull(message = "Exam date is required")
    private LocalDate examDate;
    private String notes;
    private Boolean isArchived = false;

    List<PrescriptionItemRequestDTO> itemsRequestDTOList;
}
