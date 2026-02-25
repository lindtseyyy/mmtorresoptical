package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.product.ProductAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring"
)
public interface ProductMapper {

    Product createRequestDTOToEntity(CreateProductRequestDTO createProductRequestDTO);

    ProductResponseDTO entityToResponseDTO(Product product);

    ProductDetailsDTO entityToDetailsDTO(Product product);

    ProductSummaryDTO entityToSummaryDTO(Product product);

    ProductAuditDTO entityToAuditDTO(Product product);

    List<ProductAuditDTO> entityListToAuditDTOList(
            List<Product> products);

    void updateProductFromUpdateRequestDTO(UpdateProductRequestDTO updateProductRequestDTO, @MappingTarget Product product);
}