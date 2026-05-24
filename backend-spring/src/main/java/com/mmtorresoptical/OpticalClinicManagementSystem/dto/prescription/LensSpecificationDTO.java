package com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LensSpecificationDTO {

    private String lensTypePurpose;

    // Right eye
    private BigDecimal rightSph;
    private BigDecimal rightCyl;
    private Integer rightAxis;
    private BigDecimal rightPrism;
    private BigDecimal rightAdd;
    private BigDecimal rightPd;

    // Left eye
    private BigDecimal leftSph;
    private BigDecimal leftCyl;
    private Integer leftAxis;
    private BigDecimal leftPrism;
    private BigDecimal leftAdd;
    private BigDecimal leftPd;

    // Shared fields
    private String correctionType;
    private String lensType;
    private String frameTypePreference;
    private String lensCoatings;
    private String lensMaterial;
    private String lensWearType;
    private String lensMaterialCl;
    private BigDecimal baseCurve;
    private BigDecimal diameter;
    private String notes;
}
