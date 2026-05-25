package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.RefundReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RefundReceiptRepository extends JpaRepository<RefundReceipt, UUID> {

    @Query("SELECT MAX(r.receiptNumber) FROM RefundReceipt r WHERE r.receiptNumber LIKE :prefix%")
    String findMaxReceiptNumberByPrefix(@Param("prefix") String prefix);

    @Query("SELECT COALESCE(SUM(r.actualCashback), 0) FROM RefundReceipt r")
    BigDecimal sumTotalRefundAmount();

    @Query("SELECT COALESCE(SUM(r.actualCashback), 0) FROM RefundReceipt r WHERE r.createdAt >= :start AND r.createdAt < :end")
    BigDecimal sumRefundAmountByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', r.createdAt) as day, COALESCE(SUM(r.actualCashback), 0) " +
           "FROM RefundReceipt r " +
           "WHERE r.createdAt >= :start AND r.createdAt < :end " +
           "GROUP BY FUNCTION('DATE', r.createdAt) " +
           "ORDER BY FUNCTION('DATE', r.createdAt)")
    List<Object[]> sumRefundsGroupedByDay(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
