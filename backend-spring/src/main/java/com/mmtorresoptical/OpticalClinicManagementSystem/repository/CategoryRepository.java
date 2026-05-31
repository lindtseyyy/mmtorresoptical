package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Category> findByIsActiveTrueOrderByNameAsc();

    @Query("SELECT c, COUNT(p) FROM Category c LEFT JOIN Product p ON p.category = c GROUP BY c ORDER BY c.name ASC")
    List<Object[]> findAllWithProductCounts();
}
