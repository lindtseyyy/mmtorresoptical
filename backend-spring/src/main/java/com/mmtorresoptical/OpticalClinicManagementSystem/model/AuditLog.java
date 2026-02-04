package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "log_id", updatable = false, nullable = false)
    private UUID logId;

    @NotBlank
    @Column(name = "action_type", nullable = false, length = 50)
    private ActionType actionType;

    @NotBlank
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(name = "logged_at", nullable = false, updatable = false)
    private LocalDateTime loggedAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
