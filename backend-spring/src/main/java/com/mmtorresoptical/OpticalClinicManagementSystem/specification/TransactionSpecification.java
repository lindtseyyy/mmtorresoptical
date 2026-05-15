package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.TransactionAnnotationParser;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class TransactionSpecification {
    public static Specification<Transaction> dateBetween(LocalDate minDate, LocalDate maxDate) {
        return (root, query, cb) -> {

            if (minDate == null && maxDate == null) {
                return cb.conjunction();
            }

            LocalDateTime start = null;
            LocalDateTime end = null;

            if (minDate != null) {
                start = minDate.atStartOfDay();
            }

            if (maxDate != null) {
                end = maxDate.atTime(23, 59, 59);
            }

            if (start != null && end != null) {
                return cb.between(
                        root.get("transactionDate"),
                        start,
                        end
                );
            }

            if (start != null) {
                return cb.greaterThanOrEqualTo(
                        root.get("transactionDate"),
                        start
                );
            }

            return cb.lessThanOrEqualTo(
                    root.get("transactionDate"),
                    end
            );
        };
    }

    public static Specification<Transaction> hasTransactionStatus(TransactionStatus transactionStatus) {

        return (root, query, cb) -> {
            if (transactionStatus == null) {
                return cb.conjunction(); // no filtering
            }

            return cb.equal(root.get("transactionStatus"), transactionStatus);
        };
    }

    public static Specification<Transaction> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("transactionNumber")), "%" + keyword.toLowerCase() + "%");
        };
    }

    public static Specification<Transaction> hasProductId(UUID productId) {
        return (root, query, cb) -> {
            if (productId == null) {
                return cb.conjunction();
            }

            if (query != null) {
                query.distinct(true);
            }
            Join<Object, Object> items = root.join("transactionItems", JoinType.INNER);
            return cb.equal(items.get("product").get("productId"), productId);
        };
    }

}
