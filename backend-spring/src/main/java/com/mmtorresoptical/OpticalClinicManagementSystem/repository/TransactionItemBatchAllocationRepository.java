package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItemBatchAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionItemBatchAllocationRepository extends JpaRepository<TransactionItemBatchAllocation, Long> {

    @Query("""
        SELECT a FROM TransactionItemBatchAllocation a
        JOIN FETCH a.productBatch
        WHERE a.transactionItem.transactionItemId = :transactionItemId
    """)
    List<TransactionItemBatchAllocation> findByTransactionItemId(@Param("transactionItemId") UUID transactionItemId);
}
