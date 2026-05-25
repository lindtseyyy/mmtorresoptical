package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesEncryptionConverter;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.EyeExamStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ExamType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "eye_exams")
public class EyeExam {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "eye_exam_id", updatable = false, nullable = false)
    private UUID eyeExamId;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "performed_by_id", nullable = false)
    private User performedBy;

    @Column(name = "exam_number", nullable = false, unique = true, updatable = false)
    private String examNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "medical_history_snapshot", columnDefinition = "TEXT")
    private String medicalHistorySnapshot;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "va_unconverted_od", columnDefinition = "TEXT")
    private String vaUnconvertedOd;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "va_unconverted_os", columnDefinition = "TEXT")
    private String vaUnconvertedOs;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "va_aided_od", columnDefinition = "TEXT")
    private String vaAidedOd;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "va_aided_os", columnDefinition = "TEXT")
    private String vaAidedOs;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "iop_od", columnDefinition = "TEXT")
    private String iopOd;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "iop_os", columnDefinition = "TEXT")
    private String iopOs;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "slit_lamp_examination", columnDefinition = "TEXT")
    private String slitLampExamination;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "fundus_examination", columnDefinition = "TEXT")
    private String fundusExamination;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "clinical_impression", columnDefinition = "TEXT")
    private String clinicalImpression;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "plan_notes", columnDefinition = "TEXT")
    private String planNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false)
    private ExamType examType = ExamType.MANUAL;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EyeExamStatus status = EyeExamStatus.ACTIVE;

    @Column(name = "void_reason", columnDefinition = "TEXT")
    private String voidReason;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @ManyToOne
    @JoinColumn(name = "voided_by_user_id")
    private User voidedBy;
}
