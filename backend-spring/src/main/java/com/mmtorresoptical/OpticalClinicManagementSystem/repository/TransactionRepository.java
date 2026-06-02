package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FulfillmentStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    @Query("SELECT MAX(t.transactionNumber) FROM Transaction t WHERE t.transactionNumber LIKE CONCAT(:prefix, '%')")
    String findMaxTransactionNumberByPrefix(String prefix);

    @Override
    @EntityGraph(attributePaths = {
            "transactionItems",
            "transactionItems.product",
            "user",
            "patient",
            "voidedBy"
    })
    List<Transaction> findAll(@Nullable Specification<Transaction> spec, Sort sort);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.transactionDate >= :start AND t.transactionDate < :end")
    long countByTransactionDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.transactionStatus = :status AND t.transactionDate >= :start AND t.transactionDate < :end")
    long countByTransactionStatusAndTransactionDateBetween(TransactionStatus status, LocalDateTime start, LocalDateTime end);

    long countByTransactionStatus(TransactionStatus status);

    long countByFulfillmentStatus(FulfillmentStatus status);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.fulfillmentStatus = :status AND t.transactionDate >= :start AND t.transactionDate < :end")
    long countByFulfillmentStatusAndTransactionDateBetween(FulfillmentStatus status, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.patient.patientId = :patientId")
    long countByPatientId(UUID patientId);

    @Query("SELECT MAX(t.transactionDate) FROM Transaction t WHERE t.patient.patientId = :patientId")
    LocalDateTime findMaxTransactionDateByPatientId(UUID patientId);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.patient.patientId = :patientId")
    BigDecimal sumTotalAmountByPatientId(UUID patientId);

    @Query("SELECT COALESCE(SUM(ti.quantity), 0) FROM TransactionItem ti WHERE ti.transaction.patient.patientId = :patientId")
    long sumQuantityByPatientId(UUID patientId);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t")
    BigDecimal sumTotalAmount();

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.transactionDate >= :start AND t.transactionDate < :end")
    BigDecimal sumTotalAmountByTransactionDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.transactionStatus <> :excludedStatus")
    BigDecimal sumTotalAmountExcludingStatus(TransactionStatus excludedStatus);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.transactionStatus <> :excludedStatus AND t.transactionDate >= :start AND t.transactionDate < :end")
    BigDecimal sumTotalAmountByTransactionDateBetweenExcludingStatus(LocalDateTime start, LocalDateTime end, TransactionStatus excludedStatus);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.transactionStatus = :status AND t.transactionDate >= :start AND t.transactionDate < :end")
    BigDecimal sumTotalAmountByTransactionStatusAndDateBetween(@Param("status") TransactionStatus status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.amountPaid), 0) FROM Transaction t WHERE t.transactionStatus = :status AND t.transactionDate >= :start AND t.transactionDate < :end")
    BigDecimal sumAmountPaidByTransactionStatusAndDateBetween(@Param("status") TransactionStatus status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', t.transactionDate) as day, COALESCE(SUM(t.totalAmount), 0) " +
           "FROM Transaction t " +
           "WHERE t.transactionStatus = :status " +
           "AND t.transactionDate >= :start AND t.transactionDate < :end " +
           "GROUP BY FUNCTION('DATE', t.transactionDate) " +
           "ORDER BY FUNCTION('DATE', t.transactionDate)")
    List<Object[]> sumTotalAmountByStatusGroupedByDay(@Param("status") TransactionStatus status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', t.transactionDate) as day, COALESCE(SUM(t.amountPaid), 0) " +
           "FROM Transaction t " +
           "WHERE t.transactionStatus = :status " +
           "AND t.transactionDate >= :start AND t.transactionDate < :end " +
           "GROUP BY FUNCTION('DATE', t.transactionDate) " +
           "ORDER BY FUNCTION('DATE', t.transactionDate)")
    List<Object[]> sumAmountPaidByStatusGroupedByDay(@Param("status") TransactionStatus status, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.transactionStatus <> :status")
    long countByTransactionStatusNot(TransactionStatus status);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.transactionStatus <> :status AND t.transactionDate >= :start AND t.transactionDate < :end")
    long countByTransactionStatusNotAndTransactionDateBetween(TransactionStatus status, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.transactionStatus = 'VOIDED' AND t.transactionDate >= :start AND t.transactionDate < :end")
    BigDecimal sumVoidedAmountByTransactionDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.balanceDue), 0) FROM Transaction t WHERE t.transactionStatus = 'DEPOSIT'")
    BigDecimal sumBalanceDueByTransactionStatusPartiallyPaid();

    @Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.patient WHERE t.transactionStatus = 'DEPOSIT' AND t.balanceDue > 0 AND t.transactionDate < :cutoffDate ORDER BY t.transactionDate ASC")
    List<Transaction> findAgingAccountsReceivable(LocalDateTime cutoffDate);

    @Query("SELECT MIN(t.transactionDate) FROM Transaction t")
    LocalDateTime findMinTransactionDate();

    @Query("SELECT MAX(t.transactionDate) FROM Transaction t")
    LocalDateTime findMaxTransactionDate();

    @Query("SELECT COUNT(DISTINCT t.patient.patientId) FROM Transaction t WHERE t.transactionDate >= :start AND t.transactionDate < :end AND t.patient IS NOT NULL AND t.transactionStatus <> com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus.VOIDED")
    long countDistinctPatientsByTransactionDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', t.transactionDate) as day, COALESCE(SUM(t.totalAmount), 0) " +
           "FROM Transaction t " +
           "WHERE t.transactionStatus <> :excludedStatus " +
           "AND t.transactionDate >= :start AND t.transactionDate < :end " +
           "GROUP BY FUNCTION('DATE', t.transactionDate) " +
           "ORDER BY FUNCTION('DATE', t.transactionDate)")
    List<Object[]> sumGrossRevenueGroupedByDay(LocalDateTime start, LocalDateTime end, TransactionStatus excludedStatus);
}