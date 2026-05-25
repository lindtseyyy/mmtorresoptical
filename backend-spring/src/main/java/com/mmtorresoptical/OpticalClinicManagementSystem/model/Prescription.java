package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesEncryptionConverter;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PrescriptionStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.GenerationTime;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "prescription_id", updatable = false, nullable = false)
    private UUID prescriptionId;

    @NotNull
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "rx_number", unique = true, updatable = false)
    private String rxNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Enumerated(EnumType.STRING)
    @ColumnDefault("'ACTIVE'")
    @Column(name = "status", nullable = false)
    private PrescriptionStatus status = PrescriptionStatus.ACTIVE;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @Column(name = "void_reason", columnDefinition = "TEXT")
    private String voidReason;

    // Relationships
    @ManyToOne
    @JoinColumn(name = "voided_by_user_id")
    private User voidedBy;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "eye_exam_id")
    private EyeExam eyeExam;

    @OneToMany(
            mappedBy = "prescription",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PrescriptionLensDetail> prescriptionLensDetails = new ArrayList<>();

    @OneToMany(
            mappedBy = "prescription",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PrescriptionRecommendation> prescriptionRecommendations;
}
