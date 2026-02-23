package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring"
)
public interface ProductMapper {

    Product createRequestDTOToEntity(CreateProductRequestDTO createProductRequestDTO);

    ProductResponseDTO entityToResponseDTO(Product product);

    ProductDetailsDTO entityToDetailsDTO(Product product);

    ProductSummaryDTO entityToSummaryDTO(Product product);

    void updateProductFromUpdateRequestDTO(UpdateProductRequestDTO updateProductRequestDTO, @MappingTarget Product product);
}