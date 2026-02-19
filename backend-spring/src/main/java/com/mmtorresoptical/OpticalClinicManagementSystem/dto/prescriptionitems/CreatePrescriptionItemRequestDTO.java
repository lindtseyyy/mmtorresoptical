package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreatePrescriptionItemRequestDTO {

    @NotBlank(message = "Correction Type is required")
    private String correctionType;

    @NotBlank(message = "Eye side is required")
    private String eyeSide; // LEFT / RIGHT / BOTH

    private BigDecimal sph;
    private BigDecimal cyl;
    private Integer axis;
    private BigDecimal addPower;
    private BigDecimal pd;
    private String lensType;
    private String frameTypePreference;
    private String lensCoatings;
    private String lensMaterial;
    private String lensWearType;
    private String lensMaterialCl;
    private BigDecimal baseCurve;
    private BigDecimal diameter;
    private Boolean followUpRequired = false;
    private LocalDate followUpDate;
    private String followUpReason;
    private String followUpStatus;
    private String notes;
    private Boolean isArchived;
}
