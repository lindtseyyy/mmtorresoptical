package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.CreateProductRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring"
)
public interface ProductMapper {

    Product createRequestDTOToEntity(CreateProductRequestDTO createProductRequestDTO);

    ProductResponseDTO entityToResponseDTO(Product product);

    ProductDetailsDTO entityToDetailsDTO(Product product);

}