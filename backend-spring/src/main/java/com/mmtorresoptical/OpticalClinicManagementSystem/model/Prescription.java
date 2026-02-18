package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesEncryptionConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    // Relationships
    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @OneToMany(
            mappedBy = "prescription",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PrescriptionItem> prescriptionItems;
}
