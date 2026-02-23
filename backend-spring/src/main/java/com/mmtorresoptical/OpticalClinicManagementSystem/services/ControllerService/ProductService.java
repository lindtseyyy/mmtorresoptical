package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.CreateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.UpdateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.ProductMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.ProductSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public List<ProductResponseDTO> createProduct(List<CreateProductRequestDTO> productRequestDTOList) {

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        List<Product> newProducts = productRequestDTOList
                .stream()
                .map(productRequest -> {
                    Product product = productMapper.createRequestDTOToEntity(productRequest);

                    // Handle optional image, set default if not provided
                    product.setImageDir(productRequest.getImageDir() != null ? productRequest.getImageDir() : "/default-product.png");

                    product.setUser(authenticatedUser);

                    return product;
                }).toList();

        productRepository.saveAll(newProducts);

        return newProducts.stream().map(productMapper::entityToResponseDTO).toList();
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
            String archivedStatus) {

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

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Product> products = productRepository.findAll(spec, pageable);

        return products.map(productMapper::entityToDetailsDTO);
    }

    public ProductDetailsDTO getProduct(UUID id) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        return productMapper.entityToDetailsDTO(retrievedProduct);
    }

    public ProductDetailsDTO updateProduct(UUID id, UpdateProductRequestDTO updateProductRequestDTO) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        productMapper.updateProductFromUpdateRequestDTO(updateProductRequestDTO, retrievedProduct);

        // Handle optional image, set default if not provided
        retrievedProduct.setImageDir(updateProductRequestDTO.getImageDir() != null ? updateProductRequestDTO.getImageDir() : "/default-product.png");

        Product updatedProduct = productRepository.save(retrievedProduct);

        return productMapper.entityToDetailsDTO(updatedProduct);
    }

    public void archiveProduct(UUID id) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        retrievedProduct.setIsArchived(true);

        productRepository.save(retrievedProduct);
    }

    public void restoreProduct(UUID id) {
        // Retrieve prescription or throw exception if not found
        Product retrievedProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        retrievedProduct.setIsArchived(false);

        productRepository.save(retrievedProduct);
    }

}
