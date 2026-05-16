package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "inventory_value_snapshots")
public class InventoryValueSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private LocalDate snapshotDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalValue;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
