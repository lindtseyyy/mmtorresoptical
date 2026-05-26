package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "refund_receipts")
public class RefundReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "refund_receipt_id", updatable = false, nullable = false)
    private UUID refundReceiptId;

    @Column(name = "receipt_number", length = 20, unique = true)
    private String receiptNumber;

    @Column(name = "actual_cashback", precision = 10, scale = 2)
    private BigDecimal actualCashback = BigDecimal.ZERO;

    @Column(name = "refund_method", length = 20)
    private String refundMethod;

    @Column(name = "gcash_number", length = 20)
    private String gcashNumber;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by_user_id", nullable = false)
    private User issuedBy;

    @OneToMany(mappedBy = "refundReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefundItem> refundItems = new ArrayList<>();
}
