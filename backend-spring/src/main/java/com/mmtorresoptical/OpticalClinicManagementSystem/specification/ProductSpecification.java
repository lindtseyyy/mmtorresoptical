package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProductSpecification {

    /**
     * Builds a correlated subquery expression for the hybrid reorder threshold:
     * GREATEST(lowLevelThreshold, round(dailyVelocity × leadTimeDays) + 2)
     * where dailyVelocity = net units sold in last 30 days / 30.
     *
     * Uses integer arithmetic: round(v/30 * lt) = (v * lt + 15) / 30
     */
    private static Expression<Integer> hybridReorderThreshold(
            Root<Product> root,
            CriteriaQuery<?> query,
            CriteriaBuilder cb) {

        // Correlated subquery: net units sold in last 30 days
        Subquery<Integer> velocitySub = query.subquery(Integer.class);
        Root<TransactionItem> ti = velocitySub.from(TransactionItem.class);
        Join<TransactionItem, Transaction> t = ti.join("transaction");
        velocitySub.select(cb.sum(
                cb.diff(ti.get("quantity"), cb.coalesce(ti.get("refundedQuantity"), 0))
        ));
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        velocitySub.where(cb.and(
                cb.equal(ti.get("product"), root),
                t.get("transactionStatus").in(TransactionStatus.PAID, TransactionStatus.DEPOSIT),
                cb.greaterThanOrEqualTo(t.get("transactionDate"), thirtyDaysAgo)
        ));

        // velocity = COALESCE(subquery, 0)
        Expression<Integer> velocity = cb.coalesce(velocitySub, 0);

        // leadTimeDays (default 3 if null)
        Expression<Integer> leadTime = cb.coalesce(root.get("leadTimeDays"), 3);

        // ROP = round(velocity / 30.0 * leadTimeDays) + 2
        // Integer equivalent: (velocity * leadTimeDays + 15) / 30 + 2
        Expression<Integer> velocityTimesLeadTime = cb.prod(velocity, leadTime);
        Expression<Integer> rop = cb.sum(
                cb.quot(cb.sum(velocityTimesLeadTime, 15), 30).as(Integer.class),
                2
        );

        // GREATEST(lowLevelThreshold, ROP)
        return cb.function("greatest", Integer.class, root.get("lowLevelThreshold"), rop);
    }
    public static Specification<Product> nameContains(String keyword) {
        return (root, query, cb) ->
                cb.like(
                        cb.lower(root.get("productName")),
                        "%" + keyword.toLowerCase() + "%"
                );
    }

    public static Specification<Product> hasCategory(UUID categoryId) {
        return (root, query, cb) ->
                cb.equal(root.get("category").get("categoryId"), categoryId);
    }

    public static Specification<Product> hasSupplier(UUID supplierId) {
        return (root, query, cb) ->
                cb.equal(root.get("supplier").get("supplierId"), supplierId);
    }

    public static Specification<Product> priceBetween(
            BigDecimal min,
            BigDecimal max
    ) {
        return (root, query, cb) -> {

            if (min != null && max != null) {
                return cb.between(
                        root.get("unitPrice"),
                        min,
                        max
                );
            }

            if (min != null) {
                return cb.greaterThanOrEqualTo(
                        root.get("unitPrice"),
                        min
                );
            }

            if (max != null) {
                return cb.lessThanOrEqualTo(
                        root.get("unitPrice"),
                        max
                );
            }

            return null;
        };
    }

    public static Specification<Product> quantityBetween(
            Integer min,
            Integer max
    ) {
        return (root, query, cb) -> {

            if (min != null && max != null) {
                return cb.between(
                        root.get("quantity"),
                        min,
                        max
                );
            }

            if (min != null) {
                return cb.greaterThanOrEqualTo(
                        root.get("quantity"),
                        min
                );
            }

            if (max != null) {
                return cb.lessThanOrEqualTo(
                        root.get("quantity"),
                        max
                );
            }

            return null;
        };
    }

    public static Specification<Product> hasStockStatus(String stockStatus) {
        return (root, query, cb) -> {
            if (stockStatus == null || stockStatus.isBlank()) {
                return null;
            }
            String upper = stockStatus.toUpperCase();
            if ("OUT_OF_STOCK".equals(upper)) {
                return cb.and(
                    cb.notEqual(root.get("productType"), "SERVICE"),
                    cb.equal(root.get("quantity"), 0)
                );
            }
            if ("LOW_STOCK".equals(upper)) {
                Expression<Integer> threshold = hybridReorderThreshold(root, query, cb);
                return cb.and(
                    cb.notEqual(root.get("productType"), "SERVICE"),
                    cb.greaterThan(root.get("quantity"), 0),
                    cb.lessThanOrEqualTo(root.get("quantity"), threshold)
                );
            }
            if ("OVERSTOCKED".equals(upper)) {
                return cb.and(
                    cb.notEqual(root.get("productType"), "SERVICE"),
                    cb.greaterThanOrEqualTo(
                        cb.diff(root.get("quantity"), root.get("overstockedThreshold")), 0)
                );
            }
            if ("NORMAL".equals(upper)) {
                Expression<Integer> threshold = hybridReorderThreshold(root, query, cb);
                return cb.and(
                    cb.notEqual(root.get("productType"), "SERVICE"),
                    cb.greaterThan(root.get("quantity"), threshold),
                    cb.lessThan(cb.diff(root.get("quantity"), root.get("overstockedThreshold")), 0)
                );
            }
            if ("REORDER_NEEDED".equals(upper)) {
                return cb.and(
                    cb.equal(root.get("isArchived"), false),
                    cb.notEqual(root.get("productType"), "SERVICE"),
                    cb.greaterThan(root.get("quantity"), 0)
                );
            }
            return null;
        };
    }

    public static Specification<Product> hasArchivedStatus(String status) {
        return (root, query, cb) -> {

            if (status == null || status.equalsIgnoreCase("ALL")) {
                return cb.conjunction(); // no filtering
            }

            if (status.equalsIgnoreCase("ARCHIVED")) {
                return cb.isTrue(root.get("isArchived"));
            }

            // default ACTIVE
            return cb.isFalse(root.get("isArchived"));
        };
    }

    public static Specification<Product> hasProductType(String productType) {
        return (root, query, cb) -> {
            if (productType == null || productType.isBlank()) {
                return null;
            }
            try {
                ProductType type = ProductType.valueOf(productType.toUpperCase());
                return cb.equal(root.get("productType"), type);
            } catch (IllegalArgumentException e) {
                return null;
            }
        };
    }
}
