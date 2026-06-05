package com.mmtorresoptical.OpticalClinicManagementSystem.repository;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByProductId(UUID id);

    // This finds all products that are NOT archived
    List<Product> findAllByIsArchivedFalse();

    Page<Product> findAllByIsArchivedFalse(Pageable pageable);
    Page<Product> findAllByIsArchivedTrue(Pageable pageable);

    @Query(value = """
        SELECT * FROM (
            SELECT * FROM products p
            WHERE (
                LOWER(p.product_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR levenshtein(LOWER(p.product_name), LOWER(:keyword)) <= :maxDistance
            )
            AND (:categoryId IS NULL OR p.category_id = CAST(:categoryId AS UUID))
            AND (:supplierId IS NULL OR p.supplier_id = CAST(:supplierId AS UUID))
            AND (:productType IS NULL OR p.product_type = :productType)
            AND (:minPrice IS NULL OR p.unit_price >= :minPrice)
            AND (:maxPrice IS NULL OR p.unit_price <= :maxPrice)
            AND (:minQty IS NULL OR p.quantity >= :minQty)
            AND (:maxQty IS NULL OR p.quantity <= :maxQty)
            AND (:archivedStatus IS NULL OR p.is_archived = :archivedStatus)
            AND (:stockStatus IS NULL
                OR (:stockStatus = 'OUT_OF_STOCK' AND p.product_type != 'SERVICE' AND p.quantity = 0)
                OR (:stockStatus = 'LOW_STOCK' AND p.product_type != 'SERVICE' AND p.quantity > 0 AND p.quantity <= GREATEST(p.low_level_threshold, ROUND((SELECT COALESCE(SUM(ti.quantity - COALESCE(ti.refunded_quantity, 0)), 0)::float / 30.0 * COALESCE(p.lead_time_days, 3) FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.transaction_id WHERE ti.product_id = p.product_id AND t.transaction_status IN ('PAID', 'DEPOSIT') AND t.transaction_date >= NOW() - INTERVAL '30 days'))::int + 2))
                OR (:stockStatus = 'OVERSTOCKED' AND p.product_type != 'SERVICE' AND p.quantity >= p.overstocked_threshold)
                OR (:stockStatus = 'NORMAL' AND p.product_type != 'SERVICE' AND p.quantity > GREATEST(p.low_level_threshold, ROUND((SELECT COALESCE(SUM(ti.quantity - COALESCE(ti.refunded_quantity, 0)), 0)::float / 30.0 * COALESCE(p.lead_time_days, 3) FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.transaction_id WHERE ti.product_id = p.product_id AND t.transaction_status IN ('PAID', 'DEPOSIT') AND t.transaction_date >= NOW() - INTERVAL '30 days'))::int + 2) AND p.quantity < p.overstocked_threshold)
                OR (:stockStatus = 'REORDER_NEEDED' AND p.is_archived = false AND p.product_type != 'SERVICE' AND p.quantity > 0)
            )
            ORDER BY
                CASE WHEN LOWER(p.product_name) LIKE LOWER(CONCAT('%', :keyword, '%')) THEN 0 ELSE 1 END,
                levenshtein(LOWER(p.product_name), LOWER(:keyword)) ASC
        ) AS fuzzy_results
        """,
        countQuery = """
        SELECT count(*) FROM products p
        WHERE (
            LOWER(p.product_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR levenshtein(LOWER(p.product_name), LOWER(:keyword)) <= :maxDistance
        )
        AND (:categoryId IS NULL OR p.category_id = CAST(:categoryId AS UUID))
        AND (:supplierId IS NULL OR p.supplier_id = CAST(:supplierId AS UUID))
        AND (:productType IS NULL OR p.product_type = :productType)
        AND (:minPrice IS NULL OR p.unit_price >= :minPrice)
        AND (:maxPrice IS NULL OR p.unit_price <= :maxPrice)
        AND (:minQty IS NULL OR p.quantity >= :minQty)
        AND (:maxQty IS NULL OR p.quantity <= :maxQty)
        AND (:archivedStatus IS NULL OR p.is_archived = :archivedStatus)
        AND (:stockStatus IS NULL
            OR (:stockStatus = 'OUT_OF_STOCK' AND p.product_type != 'SERVICE' AND p.quantity = 0)
            OR (:stockStatus = 'LOW_STOCK' AND p.product_type != 'SERVICE' AND p.quantity > 0 AND p.quantity <= GREATEST(p.low_level_threshold, ROUND((SELECT COALESCE(SUM(ti.quantity - COALESCE(ti.refunded_quantity, 0)), 0)::float / 30.0 * COALESCE(p.lead_time_days, 3) FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.transaction_id WHERE ti.product_id = p.product_id AND t.transaction_status IN ('PAID', 'DEPOSIT') AND t.transaction_date >= NOW() - INTERVAL '30 days'))::int + 2))
            OR (:stockStatus = 'OVERSTOCKED' AND p.product_type != 'SERVICE' AND p.quantity >= p.overstocked_threshold)
            OR (:stockStatus = 'NORMAL' AND p.product_type != 'SERVICE' AND p.quantity > GREATEST(p.low_level_threshold, ROUND((SELECT COALESCE(SUM(ti.quantity - COALESCE(ti.refunded_quantity, 0)), 0)::float / 30.0 * COALESCE(p.lead_time_days, 3) FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.transaction_id WHERE ti.product_id = p.product_id AND t.transaction_status IN ('PAID', 'DEPOSIT') AND t.transaction_date >= NOW() - INTERVAL '30 days'))::int + 2) AND p.quantity < p.overstocked_threshold)
            OR (:stockStatus = 'REORDER_NEEDED' AND p.is_archived = false AND p.product_type != 'SERVICE' AND p.quantity > 0)
        )
        """,
        nativeQuery = true)
    Page<Product> fuzzySearchProducts(
        @Param("keyword") String keyword,
        @Param("maxDistance") int maxDistance,
        @Param("categoryId") UUID categoryId,
        @Param("supplierId") UUID supplierId,
        @Param("productType") String productType,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("minQty") Integer minQty,
        @Param("maxQty") Integer maxQty,
        @Param("archivedStatus") Boolean archivedStatus,
        @Param("stockStatus") String stockStatus,
        Pageable pageable
    );
}