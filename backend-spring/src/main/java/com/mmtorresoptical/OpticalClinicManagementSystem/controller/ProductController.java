package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch.AddStockRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch.ProductBatchDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch.RemoveStockRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.CreateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.StockAdjustmentRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.UpdateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionListDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.ProductBatchService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.ProductService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductRepository productRepository;
    private final TransactionService transactionService;
    private final ProductBatchService productBatchService;

    /**
     * CREATE a new product
     * (Called from AddProduct.tsx)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ProductResponseDTO> createProduct(
            @RequestPart("product") @Valid CreateProductRequestDTO productRequest,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        ProductResponseDTO productResponseDTO = productService.createProduct(productRequest, image);

        return ResponseEntity.status(HttpStatus.CREATED).body(productResponseDTO);
    }

    /**
     * READ all non-archived products
     * (Called from ManageInventory.tsx)
     * This replaces your /search endpoint for a simpler implementation
     */
    @GetMapping
    public ResponseEntity<Page<ProductDetailsDTO>> getAllProducts(
                                                                  @RequestParam(required = false) String keyword,

                                                                  @RequestParam(required = false) UUID categoryId,
                                                                  @RequestParam(required = false) UUID supplierId,

                                                                  @RequestParam(required = false) BigDecimal minPrice,
                                                                  @RequestParam(required = false) BigDecimal maxPrice,

                                                                  @RequestParam(required = false) Integer minQty,
                                                                  @RequestParam(required = false) Integer maxQty,

                                                                  @RequestParam(defaultValue = "0") int page,
                                                                  @RequestParam(defaultValue = "10") int size,

                                                                  @RequestParam(defaultValue = "productName") String sortBy,
                                                                  @RequestParam(defaultValue = "asc") String sortOrder,

                                                                  @RequestParam(defaultValue = "ACTIVE") String archivedStatus,
                                                                  @RequestParam(required = false) String stockStatus,
                                                                  @RequestParam(required = false) String productType) {

        // Validation for sortBy column
        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");

        if(!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        Page<ProductDetailsDTO> productDetailsDTOPage = productService.getAllProducts(
                keyword,
                categoryId,
                supplierId,
                minPrice,
                maxPrice,
                minQty,
                maxQty,
                page,
                size,
                sortBy,
                sortOrder,
                archivedStatus,
                stockStatus,
                productType);

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
    public ResponseEntity<ProductDetailsDTO> updateProduct(
            @PathVariable UUID id,
            @RequestPart("product") @Valid UpdateProductRequestDTO productRequest,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        ProductDetailsDTO productDetailsDTO = productService.updateProduct(id, productRequest, image);

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
     * RESTORE a product
     * (Called from ManageInventory.tsx)
     */
    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restoreProduct(@PathVariable UUID id) {

        productService.restoreProduct(id);

        // 4. Return No Content (204)
        return ResponseEntity.noContent().build();
    }

    /**
     * Adjust stock for a product (add or remove)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/adjust-stock")
    public ResponseEntity<ProductDetailsDTO> adjustStock(
            @PathVariable UUID id,
            @Valid @RequestBody StockAdjustmentRequestDTO request) {

        ProductDetailsDTO result = productService.adjustStock(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get transactions for a specific product
     */
    @GetMapping("/{productId}/transactions")
    public ResponseEntity<Page<TransactionListDTO>> getProductTransactions(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder
    ) {
        Page<TransactionListDTO> transactions = transactionService.getAllTransactions(
                null, null, null, null, null, null,
                productId,
                page, size, sortBy, sortOrder
        );
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/summary")
    public ResponseEntity<List<ProductSummaryDTO>> getProductSummaries(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId) {
        List<ProductSummaryDTO> summaries = productService.getProductSummaries(keyword, categoryId);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/{id}/batches")
    public ResponseEntity<List<ProductBatchDTO>> getProductBatches(@PathVariable UUID id) {
        return ResponseEntity.ok(productBatchService.getBatchBreakdown(id));
    }

    @GetMapping("/{id}/available-batches")
    public ResponseEntity<List<ProductBatchDTO>> getAvailableBatches(@PathVariable UUID id) {
        return ResponseEntity.ok(productBatchService.getAvailableBatchesForDropdown(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/add-stock")
    public ResponseEntity<ProductDetailsDTO> addStock(
            @PathVariable UUID id,
            @Valid @RequestBody AddStockRequestDTO request) {
        productBatchService.addStock(id, request);
        ProductDetailsDTO result = productService.getProduct(id);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/remove-stock")
    public ResponseEntity<ProductDetailsDTO> removeStock(
            @PathVariable UUID id,
            @Valid @RequestBody RemoveStockRequestDTO request) {
        productBatchService.removeStock(id, request);
        ProductDetailsDTO result = productService.getProduct(id);
        return ResponseEntity.ok(result);
    }
}