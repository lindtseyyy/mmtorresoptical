package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Supplier> findByIsActiveTrueOrderByNameAsc();

    @Query("SELECT s, COUNT(p) FROM Supplier s LEFT JOIN Product p ON p.supplier = s GROUP BY s ORDER BY s.name ASC")
    List<Object[]> findAllWithProductCounts();
}
