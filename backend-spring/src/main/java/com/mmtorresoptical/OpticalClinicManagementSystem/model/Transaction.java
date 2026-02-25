package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "transaction_id", updatable = false, nullable = false)
    private UUID transactionId;

    @CreationTimestamp
    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @NotNull
    @Positive
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(name = "payment_type", nullable = false)
    private PaymentType paymentType;

    // OPTIONAL — for GCash
    @Column(name = "reference_number", length = 100, unique = true)
    private String referenceNumber;

    // OPTIONAL — for GCash / online payments
    @Column(name = "gcash_payment_img_dir", length = 255)
    private String gcashPaymentImgDir;

    // OPTIONAL — for cash payments
    @Column(name = "cash_tender", precision = 10, scale = 2)
    private BigDecimal cashTender;

    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(name = "transaction_status", nullable = false)
    private TransactionStatus transactionStatus;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @Column(name = "void_reason", columnDefinition = "TEXT")
    private String voidReason;


    // Relationship
    // Foreign Key — user (user_id)
    @ManyToOne
    @JoinColumn(name = "voided_by_user_id")
    private User voidedBy;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Foreign Key — patient (patient_id)
    @ManyToOne(optional = true)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @OneToMany(mappedBy = "transaction",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<TransactionItem> transactionItems;
}

