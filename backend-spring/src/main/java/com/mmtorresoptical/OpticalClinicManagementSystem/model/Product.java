package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
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

    @Column(updatable = false)
    private OffsetDateTime dateAdded = OffsetDateTime.now();

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