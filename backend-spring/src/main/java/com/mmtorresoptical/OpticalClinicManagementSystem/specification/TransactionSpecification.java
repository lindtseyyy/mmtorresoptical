package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.TransactionAnnotationParser;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    public static Specification<Transaction> hasPaymentType(PaymentType paymentType) {
        return (root, query, cb) ->
                cb.equal(root.get("paymentType"), paymentType);
    }

    public static Specification<Transaction> hasTransactionStatus(TransactionStatus transactionStatus) {

        return (root, query, cb) -> {
            if (transactionStatus == null) {
                return cb.conjunction(); // no filtering
            }

            return cb.equal(root.get("transactionStatus"), transactionStatus);
        };
    }

}
