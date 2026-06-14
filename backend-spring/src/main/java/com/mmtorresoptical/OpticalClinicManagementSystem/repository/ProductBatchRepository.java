package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {

    @Query("""
        SELECT b FROM ProductBatch b
        WHERE b.product.productId = :productId
          AND b.quantityRemaining > 0
          AND (b.expiryDate IS NULL OR b.expiryDate >= CURRENT_DATE)
        ORDER BY b.expiryDate ASC NULLS LAST, b.receivedDate ASC
    """)
    List<ProductBatch> findActiveBatchesFefo(@Param("productId") UUID productId);

    @Query("""
        SELECT b FROM ProductBatch b
        WHERE b.product.productId = :productId
        ORDER BY b.receivedDate DESC, b.createdAt DESC
    """)
    List<ProductBatch> findAllByProductId(@Param("productId") UUID productId);

    @Query("""
        SELECT b FROM ProductBatch b
        WHERE b.product.productId = :productId
          AND b.quantityRemaining > 0
          AND (b.expiryDate IS NULL OR b.expiryDate >= CURRENT_DATE)
        ORDER BY b.expiryDate ASC NULLS LAST, b.receivedDate ASC
    """)
    List<ProductBatch> findAvailableBatchesForProduct(@Param("productId") UUID productId);

    @Query("""
        SELECT COALESCE(SUM(b.quantityRemaining), 0)
        FROM ProductBatch b
        WHERE b.product.productId = :productId
          AND (b.expiryDate IS NULL OR b.expiryDate >= CURRENT_DATE)
    """)
    int sumAvailableQuantity(@Param("productId") UUID productId);
}
