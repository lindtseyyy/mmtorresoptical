package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.product.ProductAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Category;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring"
)
public interface ProductMapper {

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "supplier", ignore = true)
    Product createRequestDTOToEntity(CreateProductRequestDTO createProductRequestDTO);

    @AfterMapping
    default void applyServiceDefaults(CreateProductRequestDTO dto, @MappingTarget Product product) {
        if (dto.getProductType() == ProductType.SERVICE) {
            if (product.getQuantity() == null || product.getQuantity() < 0) {
                product.setQuantity(0);
            }
            if (product.getLowLevelThreshold() == null) {
                product.setLowLevelThreshold(0);
            }
            if (product.getOverstockedThreshold() == null) {
                product.setOverstockedThreshold(0);
            }
            if (product.getLeadTimeDays() == null) {
                product.setLeadTimeDays(0);
            }
        }
    }

    @Mapping(source = "category.categoryId", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "supplier.supplierId", target = "supplierId")
    @Mapping(source = "supplier.name", target = "supplierName")
    ProductResponseDTO entityToResponseDTO(Product product);

    @Mapping(source = "category.categoryId", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "supplier.supplierId", target = "supplierId")
    @Mapping(source = "supplier.name", target = "supplierName")
    ProductDetailsDTO entityToDetailsDTO(Product product);

    @Mapping(source = "category.categoryId", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "supplier.supplierId", target = "supplierId")
    @Mapping(source = "supplier.name", target = "supplierName")
    ProductSummaryDTO entityToSummaryDTO(Product product);

    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "supplier.name", target = "supplierName")
    ProductAuditDTO entityToAuditDTO(Product product);

    List<ProductAuditDTO> entityListToAuditDTOList(
            List<Product> products);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "supplier", ignore = true)
    void updateProductFromUpdateRequestDTO(UpdateProductRequestDTO updateProductRequestDTO, @MappingTarget Product product);

    @AfterMapping
    default void applyServiceDefaultsOnUpdate(UpdateProductRequestDTO dto, @MappingTarget Product product) {
        if (dto.getProductType() == ProductType.SERVICE) {
            if (product.getQuantity() == null || product.getQuantity() < 0) {
                product.setQuantity(0);
            }
            if (product.getLowLevelThreshold() == null) {
                product.setLowLevelThreshold(0);
            }
            if (product.getOverstockedThreshold() == null) {
                product.setOverstockedThreshold(0);
            }
            if (product.getLeadTimeDays() == null) {
                product.setLeadTimeDays(0);
            }
        }
    }
}
