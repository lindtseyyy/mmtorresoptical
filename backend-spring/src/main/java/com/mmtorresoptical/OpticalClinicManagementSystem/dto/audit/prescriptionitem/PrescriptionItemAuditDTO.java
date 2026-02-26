package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescriptionitem;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PrescriptionItemAuditDTO {

    private UUID prescriptionItemId;
    private String correctionType;
    private String eyeSide;

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
    private Boolean followUpRequired;
    private LocalDate followUpDate;
    private String followUpReason;
    private String followUpStatus;
    private String notes;

    private Boolean isArchived;
    private LocalDateTime createdAt;
    private UUID createdByUserId;
}