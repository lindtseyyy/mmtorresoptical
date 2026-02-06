package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.CorrectionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.EyeSide;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.LensType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "prescription_items")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "prescription_item_id", updatable = false, nullable = false)
    private UUID prescriptionItemId;

    @Enumerated(EnumType.STRING)
    @NotBlank
    @Column(name = "correction_type", length = 50)
    private CorrectionType correctionType;

    @Enumerated(EnumType.STRING)
    @NotBlank
    @Column(name = "eye_side", length = 10)
    private EyeSide eyeSide; // LEFT / RIGHT / BOTH

    // Optical values (decimal precision important) (optional)
    @Column(name = "sph", precision = 5, scale = 2)
    private BigDecimal sph;

    @Column(name = "cyl", precision = 5, scale = 2)
    private BigDecimal cyl;

    @Column(name = "axis")
    private Integer axis;

    @Column(name = "add_power", precision = 5, scale = 2)
    private BigDecimal addPower;

    @Column(name = "pd", precision = 5, scale = 2)
    private BigDecimal pd;

    // Lens / frame details (optional)
    @Enumerated(EnumType.STRING)
    @Column(name = "lens_type", length = 50)
    private LensType lensType;

    @Column(name = "frame_type_preference", length = 100)
    private String frameTypePreference;

    @Column(name = "lens_coatings", columnDefinition = "TEXT")
    private String lensCoatings;

    @Column(name = "lens_material", length = 50)
    private String lensMaterial;

    @Column(name = "lens_wear_type", length = 50)
    private String lensWearType;

    @Column(name = "lens_material_cl", length = 50)
    private String lensMaterialCl;

    @Column(name = "base_curve", precision = 5, scale = 2)
    private BigDecimal baseCurve;

    @Column(name = "diameter", precision = 5, scale = 2)
    private BigDecimal diameter;

    // Follow-up tracking (optional)
    @Column(name = "follow_up_required")
    private Boolean followUpRequired = false;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "follow_up_reason", columnDefinition = "TEXT")
    private String followUpReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "follow_up_status", length = 50)
    private FollowUpStatus followUpStatus;

    // Notes
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Audit fields
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationship
    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User user;

    // MANY items → ONE prescription
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

}
