package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class ProductSpecification {
    public static Specification<Product> nameContains(String keyword) {
        return (root, query, cb) ->
                cb.like(
                        cb.lower(root.get("productName")),
                        "%" + keyword.toLowerCase() + "%"
                );
    }

    public static Specification<Product> hasCategory(String category) {
        return (root, query, cb) ->
                cb.equal(root.get("category"), category);
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
}
