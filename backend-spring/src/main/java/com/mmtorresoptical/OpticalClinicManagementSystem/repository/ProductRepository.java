package com.mmtorresoptical.OpticalClinicManagementSystem.repository;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    // Basic search query. You can make this more advanced with JpaSpecificationExecutor
    @Query("SELECT p FROM Product p WHERE " +
            "(LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) OR CAST(p.productId AS STRING) LIKE :query) " +
            "AND (:category IS NULL OR p.category = :category) " +
            "AND (:supplier IS NULL OR p.supplier = :supplier)")
    List<Product> searchProducts(String query, String category, String supplier);

    // This finds all products that are NOT archived
    List<Product> findAllByIsArchivedFalse();

    Page<Product> findAllByIsArchivedFalse(Pageable pageable);
    Page<Product> findAllByIsArchivedTrue(Pageable pageable);
}