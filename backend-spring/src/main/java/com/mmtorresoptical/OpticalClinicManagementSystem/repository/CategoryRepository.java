package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.CategoryType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByNameIgnoreCaseAndCategoryType(String name, CategoryType categoryType);

    boolean existsByNameIgnoreCaseAndCategoryType(String name, CategoryType categoryType);

    List<Category> findByIsActiveTrueAndCategoryTypeOrderByNameAsc(CategoryType categoryType);

    List<Category> findByIsActiveTrueOrderByNameAsc();

    @Query("SELECT c, COUNT(p) FROM Category c LEFT JOIN Product p ON p.category = c WHERE (:type IS NULL OR c.categoryType = :type) GROUP BY c ORDER BY c.name ASC")
    List<Object[]> findAllWithProductCountsByType(@Param("type") CategoryType type);

    @Query("SELECT c, COUNT(p) FROM Category c LEFT JOIN Product p ON p.category = c GROUP BY c ORDER BY c.name ASC")
    List<Object[]> findAllWithProductCounts();
}
