package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false)
    private ProductType productType = ProductType.PHYSICAL;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer damagedQuantity = 0;

    @Column(nullable = false)
    private Integer lowLevelThreshold;

    @Column(nullable = false)
    private Integer overstockedThreshold;

    @Column(nullable = false, columnDefinition = "INTEGER NOT NULL DEFAULT 3")
    private Integer leadTimeDays = 3;

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