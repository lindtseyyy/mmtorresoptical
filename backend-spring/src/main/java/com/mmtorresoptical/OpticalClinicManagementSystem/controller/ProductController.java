package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.CreateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.UpdateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductRepository productRepository;

    /**
     * CREATE a new product
     * (Called from AddProduct.tsx)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<List<ProductResponseDTO>> createProduct(@Valid @RequestBody List<CreateProductRequestDTO> createProductRequestDTOList) {

        List<ProductResponseDTO> productResponseDTOList = productService.createProduct(createProductRequestDTOList);

        // 3. Return 201 Created with the new product object
        return ResponseEntity.status(HttpStatus.CREATED).body(productResponseDTOList);
    }

    /**
     * READ all non-archived products
     * (Called from ManageInventory.tsx)
     * This replaces your /search endpoint for a simpler implementation
     */
    @GetMapping
    public ResponseEntity<Page<ProductDetailsDTO>> getAllProducts(
                                                                  @RequestParam(required = false) String keyword,

                                                                  @RequestParam(required = false) String category,
                                                                  @RequestParam(required = false) String supplier,

                                                                  @RequestParam(required = false) BigDecimal minPrice,
                                                                  @RequestParam(required = false) BigDecimal maxPrice,

                                                                  @RequestParam(required = false) Integer minQty,
                                                                  @RequestParam(required = false) Integer maxQty,

                                                                  @RequestParam(defaultValue = "0") int page,
                                                                  @RequestParam(defaultValue = "10") int size,

                                                                  @RequestParam(defaultValue = "productName") String sortBy,
                                                                  @RequestParam(defaultValue = "asc") String sortOrder,

                                                                  @RequestParam(defaultValue = "ACTIVE") String archivedStatus) {

        // Validation for sortBy column
        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");

        if(!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        Page<ProductDetailsDTO> productDetailsDTOPage = productService.getAllProducts(
                keyword,
                category,
                supplier,
                minPrice,
                maxPrice,
                minQty,
                maxQty,
                page,
                size,
                sortBy,
                sortOrder,
                archivedStatus);

        return ResponseEntity.ok(productDetailsDTOPage);
    }

    /**
     * READ a single product by its ID
     * (Called from EditProduct.tsx)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailsDTO> getProductById(@PathVariable UUID id) {
        ProductDetailsDTO productDetailsDTO = productService.getProduct(id);
        return ResponseEntity.ok(productDetailsDTO);
    }

    /**
     * UPDATE an existing product
     * (Called from EditProduct.tsx)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductDetailsDTO> updateProduct(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequestDTO productRequest) {

        ProductDetailsDTO productDetailsDTO = productService.updateProduct(id, productRequest);

        return ResponseEntity.ok(productDetailsDTO);
    }

    /**
     * ARCHIVE a product (Soft Delete)
     * (Called from ManageInventory.tsx)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveProduct(@PathVariable UUID id) {

        productService.archiveProduct(id);

        // 4. Return No Content (204)
        return ResponseEntity.noContent().build();
    }

    /**
     * ARCHIVE a product (Soft Delete)
     * (Called from ManageInventory.tsx)
     */
    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restoreProduct(@PathVariable UUID id) {

        productService.restoreProduct(id);

        // 4. Return No Content (204)
        return ResponseEntity.noContent().build();
    }
}