package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.product.ProductAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring"
)
public interface ProductMapper {

    Product createRequestDTOToEntity(CreateProductRequestDTO createProductRequestDTO);

    @AfterMapping
    default void applyServiceDefaults(CreateProductRequestDTO dto, @MappingTarget Product product) {
        if (dto.getProductType() == ProductType.SERVICE) {
            if (product.getSupplier() == null || product.getSupplier().isBlank()) {
                product.setSupplier("In-House");
            }
            if (product.getQuantity() == null || product.getQuantity() < 0) {
                product.setQuantity(0);
            }
            if (product.getLowLevelThreshold() == null) {
                product.setLowLevelThreshold(0);
            }
            if (product.getOverstockedThreshold() == null) {
                product.setOverstockedThreshold(0);
            }
        }
    }

    ProductResponseDTO entityToResponseDTO(Product product);

    ProductDetailsDTO entityToDetailsDTO(Product product);

    ProductSummaryDTO entityToSummaryDTO(Product product);

    ProductAuditDTO entityToAuditDTO(Product product);

    List<ProductAuditDTO> entityListToAuditDTOList(
            List<Product> products);

    void updateProductFromUpdateRequestDTO(UpdateProductRequestDTO updateProductRequestDTO, @MappingTarget Product product);

    @AfterMapping
    default void applyServiceDefaultsOnUpdate(UpdateProductRequestDTO dto, @MappingTarget Product product) {
        if (dto.getProductType() == ProductType.SERVICE) {
            if (product.getSupplier() == null || product.getSupplier().isBlank()) {
                product.setSupplier("In-House");
            }
            if (product.getQuantity() == null || product.getQuantity() < 0) {
                product.setQuantity(0);
            }
            if (product.getLowLevelThreshold() == null) {
                product.setLowLevelThreshold(0);
            }
            if (product.getOverstockedThreshold() == null) {
                product.setOverstockedThreshold(0);
            }
        }
    }
}
