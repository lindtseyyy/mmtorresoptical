package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.DiscountType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "transaction_items")
public class TransactionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "transaction_item_id", updatable = false, nullable = false)
    private UUID transactionItemId;

    @NotNull
    @Min(1)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @NotNull
    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type")
    private DiscountType discountType;

    @Column(name = "discount_value", precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "refunded_quantity")
    private Integer refundedQuantity;

    @Column(name = "is_discounted", nullable = false)
    private Boolean isDiscounted = false;


    //Relationships
    // MANY items → ONE transaction
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    // MANY items → ONE product
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @OneToMany(
            mappedBy = "transactionItem",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Refund> refunds = new ArrayList<>();

}
