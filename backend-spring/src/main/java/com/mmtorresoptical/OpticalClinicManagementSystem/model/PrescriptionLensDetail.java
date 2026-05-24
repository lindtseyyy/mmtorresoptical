package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesBigDecimalConverter;
import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesEncryptionConverter;
import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesIntegerConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "prescription_lens_details")
public class PrescriptionLensDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "lens_type_purpose", columnDefinition = "TEXT", nullable = false)
    private String lensTypePurpose;

    // Right eye
    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "right_sph", columnDefinition = "TEXT")
    private BigDecimal rightSph;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "right_cyl", columnDefinition = "TEXT")
    private BigDecimal rightCyl;

    @Convert(converter = AesIntegerConverter.class)
    @Column(name = "right_axis", columnDefinition = "TEXT")
    private Integer rightAxis;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "right_prism", columnDefinition = "TEXT")
    private BigDecimal rightPrism;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "right_add", columnDefinition = "TEXT")
    private BigDecimal rightAdd;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "right_pd", columnDefinition = "TEXT")
    private BigDecimal rightPd;

    // Left eye
    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "left_sph", columnDefinition = "TEXT")
    private BigDecimal leftSph;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "left_cyl", columnDefinition = "TEXT")
    private BigDecimal leftCyl;

    @Convert(converter = AesIntegerConverter.class)
    @Column(name = "left_axis", columnDefinition = "TEXT")
    private Integer leftAxis;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "left_prism", columnDefinition = "TEXT")
    private BigDecimal leftPrism;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "left_add", columnDefinition = "TEXT")
    private BigDecimal leftAdd;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "left_pd", columnDefinition = "TEXT")
    private BigDecimal leftPd;

    // Shared fields
    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "correction_type", columnDefinition = "TEXT")
    private String correctionType;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "lens_type", columnDefinition = "TEXT")
    private String lensType;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "frame_type_preference", columnDefinition = "TEXT")
    private String frameTypePreference;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "lens_coatings", columnDefinition = "TEXT")
    private String lensCoatings;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "lens_material", columnDefinition = "TEXT")
    private String lensMaterial;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "lens_wear_type", columnDefinition = "TEXT")
    private String lensWearType;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "lens_material_cl", columnDefinition = "TEXT")
    private String lensMaterialCl;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "base_curve", columnDefinition = "TEXT")
    private BigDecimal baseCurve;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "diameter", columnDefinition = "TEXT")
    private BigDecimal diameter;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User user;
}
