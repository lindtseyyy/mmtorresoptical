package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID productId;

    @Column(nullable = false)
    private String productName;

    private String imageDir;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String supplier;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer lowLevelThreshold;

    @Column(nullable = false)
    private Integer overstockedThreshold;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private Boolean isArchived = false;

    //Relationships
    @OneToMany(mappedBy = "product",
            cascade = CascadeType.ALL)
    private List<TransactionItem> transactionItems;

    // Relationships
    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User user;
}