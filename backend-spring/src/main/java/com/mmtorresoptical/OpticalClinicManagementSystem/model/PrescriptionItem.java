package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.converter.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.CorrectionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.EyeSide;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.LensType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "prescription_items")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "prescription_item_id", updatable = false, nullable = false)
    private UUID prescriptionItemId;

    @Convert(converter = AesCorrectionTypeConverter.class)
    @NotNull
    @Column(name = "correction_type", columnDefinition = "TEXT")
    private CorrectionType correctionType;

    @Convert(converter = AesEyeSideConverter.class)
    @NotNull
    @Column(name = "eye_side", columnDefinition = "TEXT")
    private EyeSide eyeSide; // LEFT / RIGHT / BOTH

    // Optical values (decimal precision important) (optional)
    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "sph", columnDefinition = "TEXT")
    private BigDecimal sph;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "cyl", columnDefinition = "TEXT")
    private BigDecimal cyl;

    @Convert(converter = AesIntegerConverter.class)
    @Column(name = "axis", columnDefinition = "TEXT")
    private Integer axis;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "add_power", columnDefinition = "TEXT")
    private BigDecimal addPower;

    @Convert(converter = AesBigDecimalConverter.class)
    @Column(name = "pd", columnDefinition = "TEXT")
    private BigDecimal pd;

    // Lens / frame details (optional)
    @Convert(converter = AesLensTypeConverter.class)
    @Column(name = "lens_type", columnDefinition = "TEXT")
    private LensType lensType;

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

    // Follow-up tracking (optional)
    @Column(name = "follow_up_required")
    private Boolean followUpRequired = false;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "follow_up_reason", columnDefinition = "TEXT")
    private String followUpReason;

    @Convert(converter = AesFollowUpStatusConverter.class)
    @Column(name = "follow_up_status", columnDefinition = "TEXT")
    private FollowUpStatus followUpStatus;

    // Notes
    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Audit fields
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    // Relationship
    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User user;

    // MANY items → ONE prescription
//    @ManyToOne(fetch = FetchType.LAZY)
    @ManyToOne
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;
}
