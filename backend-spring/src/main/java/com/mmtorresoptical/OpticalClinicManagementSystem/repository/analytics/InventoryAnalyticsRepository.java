package com.mmtorresoptical.OpticalClinicManagementSystem.repository.analytics;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryAnalyticsRepository extends JpaRepository<Product, UUID> {

    /*
     * TOTAL INVENTORY VALUE
     * (No date range needed – inventory is current state)
     */
    @Query("""
        SELECT COALESCE(SUM(p.unitPrice * p.quantity), 0)
        FROM Product p
        WHERE p.isArchived = false
    """)
    BigDecimal inventoryValue();


    /*
     * LOW STOCK COUNT
     */
    @Query("""
        SELECT COUNT(p)
        FROM Product p
        WHERE p.quantity <= p.lowLevelThreshold
          AND p.isArchived = false
    """)
    long countLowStockProducts();


    /*
     * OVERSTOCKED COUNT
     */
    @Query("""
        SELECT COUNT(p)
        FROM Product p
        WHERE p.quantity >= p.overstockedThreshold
          AND p.isArchived = false
    """)
    long countOverstockedProducts();


    /*
     * LOW STOCK LIST (Paginated)
     */
    @Query("""
        SELECT p
        FROM Product p
        WHERE p.quantity <= p.lowLevelThreshold
          AND p.isArchived = false
    """)
    Page<Product> findLowStockProducts(Pageable pageable);


    /*
     * OVERSTOCKED LIST (Paginated)
     */
    @Query("""
        SELECT p
        FROM Product p
        WHERE p.quantity >= p.overstockedThreshold
          AND p.isArchived = false
    """)
    Page<Product> findOverstockedProducts(Pageable pageable);


    /*
     * TOP SELLING PRODUCTS BETWEEN DATE RANGE
     * Fully parameterized
     * Pageable controls limit
     */
    @Query("""
    SELECT new com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO(
        p.productId,
        p.productName,
        p.unitPrice,
        SUM(ti.quantity - COALESCE(ti.refundedQuantity, 0)),
        SUM(
            ti.subtotal
            -
            COALESCE(
                (SELECT SUM(r.refundAmount)
                 FROM Refund r
                 WHERE r.transactionItem = ti),
                0
            )
        )
    )
    FROM TransactionItem ti
    JOIN ti.transaction t
    JOIN ti.product p
    WHERE t.transactionStatus IN (
        com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus.COMPLETED,
        com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus.PARTIALLY_REFUNDED
    )
      AND t.transactionDate >= :startDate
      AND t.transactionDate < :endDate
    GROUP BY p.productId, p.productName, p.unitPrice
    ORDER BY SUM(
        ti.subtotal
        -
        COALESCE(
            (SELECT SUM(r.refundAmount)
             FROM Refund r
             WHERE r.transactionItem = ti),
            0
        )
    ) DESC
""")
    List<TopSellingProductDTO> findTopSellingProducts(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
