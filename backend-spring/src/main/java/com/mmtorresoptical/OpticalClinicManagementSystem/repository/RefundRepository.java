package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<Refund, UUID> {

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r")
    BigDecimal sumTotalRefundAmount();

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r WHERE r.refundedAt >= :start AND r.refundedAt < :end")
    BigDecimal sumRefundAmountByRefundedAtBetween(LocalDateTime start, LocalDateTime end);

}