package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.UUID;

public class ProductSpecification {
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

    public static Specification<Product> hasSupplier(String supplier) {
        return (root, query, cb) ->
                cb.equal(root.get("supplier"), supplier);
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
                return cb.and(
                    cb.notEqual(root.get("productType"), "SERVICE"),
                    cb.greaterThan(root.get("quantity"), 0),
                    cb.lessThanOrEqualTo(
                        cb.diff(root.get("quantity"), root.get("lowLevelThreshold")), 0)
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
                return cb.and(
                    cb.notEqual(root.get("productType"), "SERVICE"),
                    cb.greaterThan(cb.diff(root.get("quantity"), root.get("lowLevelThreshold")), 0),
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
