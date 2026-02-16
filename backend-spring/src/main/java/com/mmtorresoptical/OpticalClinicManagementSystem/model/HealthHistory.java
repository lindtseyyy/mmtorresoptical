package com.mmtorresoptical.OpticalClinicManagementSystem.model;

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

    @Column(name = "eye_conditions", columnDefinition = "TEXT")
    private String eyeConditions;

    @Column(name = "systemic_conditions", columnDefinition = "TEXT")
    private String systemicConditions;

    @Column(name = "medications", columnDefinition = "TEXT")
    private String medications;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "visual_acuity_right", length = 20)
    private String visualAcuityRight;

    @Column(name = "visual_acuity_left", length = 20)
    private String visualAcuityLeft;

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

