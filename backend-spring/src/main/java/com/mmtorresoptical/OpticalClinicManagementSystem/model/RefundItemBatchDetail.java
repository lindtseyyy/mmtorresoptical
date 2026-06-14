package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "refund_item_batch_details")
public class RefundItemBatchDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id", updatable = false, nullable = false)
    private Long detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_item_id", nullable = false)
    private RefundItem refundItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_batch_id", nullable = false)
    private ProductBatch productBatch;

    @Column(name = "quantity_restored", nullable = false)
    private Integer quantityRestored;
}
