package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.ProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * CREATE a new product
     * (Called from AddProduct.tsx)
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductRequestDTO productRequest) {
        // 1. Create new Product entity from DTO
        Product product = new Product();
        product.setProductName(productRequest.getProductName());
        product.setCategory(productRequest.getCategory());
        product.setSupplier(productRequest.getSupplier());
        product.setUnitPrice(productRequest.getUnitPrice());
        product.setQuantity(productRequest.getQuantity());
        product.setLowLevelThreshold(productRequest.getLowLevelThreshold());
        product.setOverstockedThreshold(productRequest.getOverstockedThreshold());
        product.setIsArchived(productRequest.getIsArchived());

        // Handle optional image, set default if not provided
        product.setImageDir(productRequest.getImageDir() != null ? productRequest.getImageDir() : "/default-product.png");

        // 2. Save product
        Product savedProduct = productRepository.save(product);
        System.out.println("savedProduct: " + savedProduct);

        // 3. Return 201 Created with the new product object
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    /**
     * READ all non-archived products
     * (Called from ManageInventory.tsx)
     * This replaces your /search endpoint for a simpler implementation
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        // Find all products that are not archived
        List<Product> products = productRepository.findAllByIsArchivedFalse();
        return ResponseEntity.ok(products);
    }

    /**
     * READ a single product by its ID
     * (Called from EditProduct.tsx)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return ResponseEntity.ok(product);
    }

    /**
     * UPDATE an existing product
     * (Called from EditProduct.tsx)
     */
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequestDTO productRequest) {
        // 1. Find the existing product
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // 2. Update the entity's fields from the DTO
        product.setProductName(productRequest.getProductName());
        product.setCategory(productRequest.getCategory());
        product.setSupplier(productRequest.getSupplier());
        product.setUnitPrice(productRequest.getUnitPrice());
        product.setQuantity(productRequest.getQuantity());
        product.setLowLevelThreshold(productRequest.getLowLevelThreshold());
        product.setOverstockedThreshold(productRequest.getOverstockedThreshold());
        product.setIsArchived(productRequest.getIsArchived());
        product.setImageDir(productRequest.getImageDir() != null ? productRequest.getImageDir() : "/default-product.png");

        // 3. Save the updated product
        Product updatedProduct = productRepository.save(product);
        return ResponseEntity.ok(updatedProduct);
    }

    /**
     * ARCHIVE a product (Soft Delete)
     * (Called from ManageInventory.tsx)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveProduct(@PathVariable UUID id) {
        // 1. Find the existing product
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // 2. Set the 'isArchived' flag to true
        product.setIsArchived(true);

        // 3. Save the change
        productRepository.save(product);

        // 4. Return No Content (204)
        return ResponseEntity.noContent().build();
    }
}