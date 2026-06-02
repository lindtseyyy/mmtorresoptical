package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.CategoryType;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.CreateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.StockAdjustmentRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.UpdateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.InsufficientStockException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.ProductMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Category;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Supplier;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.CategoryRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.SupplierRepository;
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
    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final SupplierService supplierService;
    private final SupplierRepository supplierRepository;

    @Transactional
    public ProductResponseDTO createProduct(CreateProductRequestDTO productRequest, MultipartFile image) {

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Product product = productMapper.createRequestDTOToEntity(productRequest);

        product.setCategory(resolveCategory(productRequest.getCategoryId(), productRequest.getNewCategoryName(), productRequest.getProductType()));
        product.setSupplier(resolveSupplier(productRequest.getProductType(), productRequest.getSupplierId(), productRequest.getNewSupplierName()));

        // Handle image upload — store file to disk, save filename in entity
        if (product.getProductType() == com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType.SERVICE) {
            product.setImageDir(null);
        } else {
            String storedFilename = fileStorageService.store(image);
            if (storedFilename != null) {
                product.setImageDir(storedFilename);
            } else {
                product.setImageDir("default_product_logo.png");
            }
        }

        product.setUser(authenticatedUser);

        productRepository.saveAndFlush(product);

        // Audit Logging
        productAuditHelper.logCreate(product);

        return productMapper.entityToResponseDTO(product);
    }

    public Page<ProductDetailsDTO> getAllProducts(
            String keyword,
            UUID categoryId,
            UUID supplierId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minQty,
            Integer maxQty,
            int page,
            int size,
            String sortBy,
            String sortOrder,
            String archivedStatus,
            String stockStatus,
            String productType) {

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

        // Fuzzy search path — Levenshtein-based matching when keyword is present
        if (keyword != null && !keyword.isBlank()) {
            Boolean mappedArchivedStatus;
            if ("ARCHIVED".equalsIgnoreCase(archivedStatus)) {
                mappedArchivedStatus = true;
            } else if ("ACTIVE".equalsIgnoreCase(archivedStatus)) {
                mappedArchivedStatus = false;
            } else {
                mappedArchivedStatus = null;
            }

            String effectiveProductType = (productType != null && !productType.isBlank()) ? productType : null;
            String effectiveStockStatus = (stockStatus != null && !stockStatus.isBlank()) ? stockStatus : null;

            Pageable pageable = PageRequest.of(page, size);

            Page<Product> products = productRepository.fuzzySearchProducts(
                    keyword,
                    3,
                    categoryId,
                    supplierId,
                    effectiveProductType,
                    minPrice,
                    maxPrice,
                    minQty,
                    maxQty,
                    mappedArchivedStatus,
                    effectiveStockStatus,
                    pageable
            );

            Page<ProductDetailsDTO> dtoPage = products.map(productMapper::entityToDetailsDTO);
            inventoryAnalyticsService.enrichWithReorderPoints(dtoPage.getContent());
            return dtoPage;
        }

        Specification<Product> spec = Specification.allOf();

        if (categoryId != null) {
            spec = spec.and(ProductSpecification.hasCategory(categoryId));
        }

        if (supplierId != null) {
            spec = spec.and(ProductSpecification.hasSupplier(supplierId));
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

        if (productType != null && !productType.isBlank()) {
            spec = spec.and(ProductSpecification.hasProductType(productType));
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

        // Preserve existing imageDir before MapStruct overwrites it from the (null) DTO
        String existingImageDir = retrievedProduct.getImageDir();

        productMapper.updateProductFromUpdateRequestDTO(updateProductRequestDTO, retrievedProduct);

        if (updateProductRequestDTO.getCategoryId() != null || updateProductRequestDTO.getNewCategoryName() != null) {
            retrievedProduct.setCategory(resolveCategory(updateProductRequestDTO.getCategoryId(), updateProductRequestDTO.getNewCategoryName(), updateProductRequestDTO.getProductType()));
        }

        if (updateProductRequestDTO.getSupplierId() != null || updateProductRequestDTO.getNewSupplierName() != null) {
            retrievedProduct.setSupplier(resolveSupplier(updateProductRequestDTO.getProductType(), updateProductRequestDTO.getSupplierId(), updateProductRequestDTO.getNewSupplierName()));
        }

        // Handle image — new upload replaces old, otherwise keep existing
        if (image != null && !image.isEmpty()) {
            String storedFilename = fileStorageService.store(image);
            retrievedProduct.setImageDir(storedFilename);
        } else {
            // MapStruct copied null imageDir from the DTO — restore the existing one
            retrievedProduct.setImageDir(existingImageDir);
        }

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

    public List<ProductSummaryDTO> getProductSummaries(String keyword, UUID categoryId) {
        Specification<Product> spec = Specification.where(ProductSpecification.hasArchivedStatus("ACTIVE"));

        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(ProductSpecification.nameContains(keyword));
        }

        if (categoryId != null) {
            spec = spec.and(ProductSpecification.hasCategory(categoryId));
        }

        List<Product> products = productRepository.findAll(spec, Sort.by("productName"));
        return products.stream()
                .map(productMapper::entityToSummaryDTO)
                .collect(Collectors.toList());
    }

    private Category resolveCategory(UUID categoryId, String newCategoryName, com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType productType) {
        CategoryType categoryType = (productType == com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType.SERVICE)
                ? CategoryType.SERVICE
                : CategoryType.PHYSICAL;
        System.out.println(">>> resolveCategory called: categoryId=" + categoryId + ", newCategoryName=" + newCategoryName + ", categoryType=" + categoryType);
        if (categoryId != null) {
            return categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + categoryId));
        }
        if (newCategoryName != null && !newCategoryName.isBlank()) {
            Category result = categoryService.findOrCreate(newCategoryName.trim(), categoryType);
            System.out.println(">>> Created/found category: " + result.getCategoryId() + " = " + result.getName());
            return result;
        }
        throw new IllegalArgumentException("Either categoryId or newCategoryName must be provided");
    }

    private Supplier resolveSupplier(com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType productType, UUID supplierId, String newSupplierName) {
        System.out.println(">>> resolveSupplier called: productType=" + productType + ", supplierId=" + supplierId + ", newSupplierName=" + newSupplierName);
        if (productType == com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType.SERVICE) {
            return supplierService.findOrCreate("In-House");
        }
        if (supplierId != null) {
            return supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new IllegalArgumentException("Supplier not found with id: " + supplierId));
        }
        if (newSupplierName != null && !newSupplierName.isBlank()) {
            Supplier result = supplierService.findOrCreate(newSupplierName.trim());
            System.out.println(">>> Created/found supplier: " + result.getSupplierId() + " = " + result.getName());
            return result;
        }
        throw new IllegalArgumentException("Either supplierId or newSupplierName must be provided");
    }

}
