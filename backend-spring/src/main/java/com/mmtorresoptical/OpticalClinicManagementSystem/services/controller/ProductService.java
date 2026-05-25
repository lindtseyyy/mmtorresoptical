package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.CreateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.StockAdjustmentRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.UpdateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.InsufficientStockException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.ProductMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.ProductAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.FileStorageService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.ProductSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final AuthenticatedUserService authenticatedUserService;
    private final ProductAuditHelper productAuditHelper;
    private final JSONService jsonService;
    private final InventoryAnalyticsService inventoryAnalyticsService;
    private final FileStorageService fileStorageService;

    @Transactional
    public ProductResponseDTO createProduct(CreateProductRequestDTO productRequest, MultipartFile image) {

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Product product = productMapper.createRequestDTOToEntity(productRequest);

        // Handle image upload — store file to disk, save filename in entity
        String storedFilename = fileStorageService.store(image);
        if (storedFilename != null) {
            product.setImageDir(storedFilename);
        } else {
            product.setImageDir("default_product_logo.png");
        }

        product.setUser(authenticatedUser);

        productRepository.saveAndFlush(product);

        // Audit Logging
        productAuditHelper.logCreate(product);

        return productMapper.entityToResponseDTO(product);
    }

    public Page<ProductDetailsDTO> getAllProducts(
            String keyword,
            String category,
            String supplier,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minQty,
            Integer maxQty,
            int page,
            int size,
            String sortBy,
            String sortOrder,
            String archivedStatus,
            String stockStatus) {

        if (keyword != null && UUIDUtils.isUUID(keyword)) {

            Optional<Product> product =
                    productRepository.findById(UUID.fromString(keyword));

            if (product.isEmpty()) {
                return Page.empty();
            }

            return new PageImpl<>(
                    List.of(productMapper.entityToDetailsDTO(product.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        Specification<Product> spec = Specification.allOf();

        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(ProductSpecification.nameContains(keyword));
        }

        if (category != null && !category.isBlank()) {
            spec = spec.and(ProductSpecification.hasCategory(category));
        }

        if (supplier != null && !supplier.isBlank()) {
            spec = spec.and(ProductSpecification.hasSupplier(supplier));
        }

        if (minPrice != null || maxPrice != null) {
            spec = spec.and(
                    ProductSpecification.priceBetween(minPrice, maxPrice)
            );
        }

        if (minQty != null || maxQty != null) {
            spec = spec.and(
                    ProductSpecification.quantityBetween(minQty, maxQty)
            );
        }

        spec = spec.and(
                ProductSpecification.hasArchivedStatus(archivedStatus)
        );

        if (stockStatus != null && !stockStatus.isBlank()) {
            spec = spec.and(ProductSpecification.hasStockStatus(stockStatus));
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Product> products = productRepository.findAll(spec, pageable);

        Page<ProductDetailsDTO> dtoPage = products.map(productMapper::entityToDetailsDTO);
        inventoryAnalyticsService.enrichWithReorderPoints(dtoPage.getContent());

        return dtoPage;
    }

    public ProductDetailsDTO getProduct(UUID id) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        ProductDetailsDTO dto = productMapper.entityToDetailsDTO(retrievedProduct);
        inventoryAnalyticsService.enrichWithReorderPoints(List.of(dto));
        return dto;
    }

    public ProductDetailsDTO updateProduct(UUID id, UpdateProductRequestDTO updateProductRequestDTO, MultipartFile image) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // Create a copy for logging (BEFORE snapshot)
        Product beforeUpdate = new Product();
        BeanUtils.copyProperties(retrievedProduct, beforeUpdate);

        productMapper.updateProductFromUpdateRequestDTO(updateProductRequestDTO, retrievedProduct);

        // Handle image — new upload replaces old, otherwise keep existing
        if (image != null && !image.isEmpty()) {
            String storedFilename = fileStorageService.store(image);
            retrievedProduct.setImageDir(storedFilename);
        }
        // If no new image is uploaded, keep the existing imageDir from the DB.
        // The DTO's imageDir field is ignored in multipart mode since image comes as a file part.

        Product updatedProduct = productRepository.save(retrievedProduct);

        // Audit Logging
        productAuditHelper.logUpdate(beforeUpdate, updatedProduct);

        ProductDetailsDTO dto = productMapper.entityToDetailsDTO(updatedProduct);
        inventoryAnalyticsService.enrichWithReorderPoints(List.of(dto));
        return dto;
    }

    public void archiveProduct(UUID id) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        retrievedProduct.setIsArchived(true);

        productRepository.save(retrievedProduct);

        // Audit Logging
        productAuditHelper.logArchive(retrievedProduct);
    }

    @Transactional
    public ProductDetailsDTO adjustStock(UUID id, StockAdjustmentRequestDTO request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (product.getProductType() == com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType.SERVICE) {
            throw new IllegalStateException("Cannot adjust stock for service products");
        }

        Product beforeProduct = new Product();
        BeanUtils.copyProperties(product, beforeProduct);

        String adjustmentType = request.getAdjustmentType();
        int amount = request.getAmount();

        if ("ADD_STOCK".equals(adjustmentType)) {
            product.setQuantity(product.getQuantity() + amount);
        } else if ("REMOVE_STOCK".equals(adjustmentType)) {
            if (product.getQuantity() < amount) {
                throw new InsufficientStockException(
                        "Insufficient stock. Current quantity: " + product.getQuantity()
                                + ", requested removal: " + amount);
            }
            product.setQuantity(product.getQuantity() - amount);
        } else {
            throw new IllegalArgumentException("Invalid adjustment type: " + adjustmentType);
        }

        Product updatedProduct = productRepository.save(product);

        productAuditHelper.logAdjustment(beforeProduct, updatedProduct, request);

        ProductDetailsDTO dto = productMapper.entityToDetailsDTO(updatedProduct);
        inventoryAnalyticsService.enrichWithReorderPoints(List.of(dto));
        return dto;
    }

    public void restoreProduct(UUID id) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        retrievedProduct.setIsArchived(false);

        productRepository.save(retrievedProduct);

        // Audit Logging
        productAuditHelper.logRestore(retrievedProduct);
    }

    public List<ProductSummaryDTO> getProductSummaries(String keyword, String category) {
        Specification<Product> spec = Specification.where(ProductSpecification.hasArchivedStatus("ACTIVE"));

        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(ProductSpecification.nameContains(keyword));
        }

        if (category != null && !category.isBlank()) {
            spec = spec.and(ProductSpecification.hasCategory(category));
        }

        List<Product> products = productRepository.findAll(spec, Sort.by("productName"));
        return products.stream()
                .map(productMapper::entityToSummaryDTO)
                .collect(Collectors.toList());
    }

}
