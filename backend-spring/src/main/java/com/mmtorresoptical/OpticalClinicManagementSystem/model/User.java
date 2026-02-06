package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Role;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID userId;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String firstName;

    private String middleName;

    @Column(nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String contactNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // "Admin" or "Staff"

    @Column(updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    private Boolean isArchived = false;

    // Relationships
    @OneToMany(mappedBy = "user")
    private Set<Prescription> prescription;

    @OneToMany(mappedBy = "user")
    private Set<PrescriptionItem> prescriptionItems;

    @OneToMany(mappedBy = "user")
    private Set<HealthHistory> healthHistory;

    @OneToMany(mappedBy = "user")
    private List<AuditLog> auditLogs;

    @OneToMany(mappedBy = "user")
    private List<Transaction> transactions;

}