package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class PrescriptionItemResponseDTO {

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
    private UserSummaryDTO createdBy;
}
