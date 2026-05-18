package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Column(name = "transaction_id", nullable = false)
    private UUID transactionId;

    @Column(name = "transaction_item_id", nullable = false)
    private UUID transactionItemId;

    @Column(name = "cash_returned_amount", precision = 10, scale = 2)
    private BigDecimal cashReturnedAmount;

    @Column(name = "date_issued", nullable = false)
    private LocalDateTime dateIssued;

    @ManyToOne
    @JoinColumn(name = "issued_by_user_id", nullable = false)
    private User issuedBy;
}
