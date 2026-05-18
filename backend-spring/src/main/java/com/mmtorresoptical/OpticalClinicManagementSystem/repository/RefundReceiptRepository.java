package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.RefundReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RefundReceiptRepository extends JpaRepository<RefundReceipt, UUID> {

    @Query("SELECT MAX(r.receiptNumber) FROM RefundReceipt r WHERE r.receiptNumber LIKE :prefix%")
    String findMaxReceiptNumberByPrefix(@Param("prefix") String prefix);
}
