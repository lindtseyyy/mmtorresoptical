package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Role;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private Gender gender;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "contact_number", nullable = false)
    private String contactNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role; // "Admin" or "Staff"

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Column(name="full_name_sortable", nullable = false)
    private String fullNameSortable;

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