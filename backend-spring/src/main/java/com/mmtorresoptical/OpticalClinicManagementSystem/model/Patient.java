package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.converter.AesEncryptionConverter;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "patient_id")
    private UUID patientId;

    @Convert(converter = AesEncryptionConverter.class)
    @Size(max = 50)
    @NotNull
    @Column(name = "first_name", nullable = false, length = 50, columnDefinition = "TEXT")
    private String firstName;

    @Convert(converter = AesEncryptionConverter.class)
    @Size(max = 50)
    @NotNull
    @Column(name = "middle_name", nullable = false, length = 50, columnDefinition = "TEXT")
    private String middleName;

    @Convert(converter = AesEncryptionConverter.class)
    @Size(max = 50)
    @NotNull
    @Column(name = "last_name", nullable = false, length = 50, columnDefinition = "TEXT")
    private String lastName;

    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(name = "gender", nullable = false, length = 10)
    private Gender gender;

    @Convert(converter = AesEncryptionConverter.class)
    @Size(max = 15)
    @NotNull
    @Column(name = "contact_number", nullable = false, length = 15, columnDefinition = "TEXT")
    private String contactNumber;

    @Convert(converter = AesEncryptionConverter.class)
    @Email
    @Size(max = 100)
    @NotNull
    @Column(name = "email", nullable = false, length = 100, unique = true, columnDefinition = "TEXT")
    private String email;

    @NotNull
    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Convert(converter = AesEncryptionConverter.class)
    @Size(max = 255)
    @NotNull
    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @OneToMany(mappedBy = "patient")
    private Set<Prescription> prescriptions;

    @OneToMany(mappedBy = "patient")
    private Set<HealthHistory> healthHistory;

    @OneToMany(mappedBy = "patient")
    private List<Transaction> transactions;
}
