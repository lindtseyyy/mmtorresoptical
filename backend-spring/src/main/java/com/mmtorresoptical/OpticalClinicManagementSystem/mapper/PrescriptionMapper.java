package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.PrescriptionDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.PrescriptionListDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.PrescriptionResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring",
        uses = {UserMapper.class, PrescriptionItemMapper.class}
)
public interface PrescriptionMapper {

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    PrescriptionResponseDTO entityToResponseDTO(Prescription prescription);

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    PrescriptionDetailsDTO entityToDetailsDTO(Prescription prescription);

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    PrescriptionListDTO entityToListDTO(Prescription prescription);
}
