package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring",
        uses = UserMapper.class
)
public interface PrescriptionItemMapper {

    PrescriptionItem requestDTOtoEntity(PrescriptionItemRequestDTO requestDTO);

    @Mapping(
            target = "correctionType",
            expression = "java(item.getCorrectionType() != null ? item.getCorrectionType().name() : null)"
    )
    @Mapping(
            target = "eyeSide",
            expression = "java(item.getEyeSide() != null ? item.getEyeSide().name() : null)"
    )
    @Mapping(
            target = "lensType",
            expression = "java(item.getLensType() != null ? item.getLensType().name() : null)"
    )
    @Mapping(
            target = "followUpStatus",
            expression = "java(item.getFollowUpStatus() != null ? item.getFollowUpStatus().name() : null)"
    )
    @Mapping(
            target = "createdBy",
            source = "user"
    )
    PrescriptionItemResponseDTO entityToResponseDTO(PrescriptionItem item);
}
