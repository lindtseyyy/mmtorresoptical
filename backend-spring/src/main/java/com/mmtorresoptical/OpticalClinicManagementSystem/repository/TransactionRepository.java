package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    Boolean existsByReferenceNumber(String referenceNumber);

    @Override
    @EntityGraph(attributePaths = {
            "transactionItems",
            "transactionItems.product",
            "transactionItems.refunds",
            "user",
            "patient",
            "voidedBy"
    })
    List<Transaction> findAll(@Nullable Specification<Transaction> spec, Sort sort);

}