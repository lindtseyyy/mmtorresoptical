package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesEncryptionConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "health_histories")
public class HealthHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "history_id", updatable = false, nullable = false)
    private UUID historyId;

    @NotNull
    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "eye_conditions", columnDefinition = "TEXT")
    private String eyeConditions;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "systemic_conditions", columnDefinition = "TEXT")
    private String systemicConditions;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "medications", columnDefinition = "TEXT")
    private String medications;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "visual_acuity_right", columnDefinition = "TEXT")
    private String visualAcuityRight;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "visual_acuity_left", columnDefinition = "TEXT")
    private String visualAcuityLeft;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
}

