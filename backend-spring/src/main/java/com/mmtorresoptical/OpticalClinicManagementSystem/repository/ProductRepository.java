package com.mmtorresoptical.OpticalClinicManagementSystem.repository;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByProductId(UUID id);

    // This finds all products that are NOT archived
    List<Product> findAllByIsArchivedFalse();

    Page<Product> findAllByIsArchivedFalse(Pageable pageable);
    Page<Product> findAllByIsArchivedTrue(Pageable pageable);
}