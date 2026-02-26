package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescription.PrescriptionAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescriptionitem.PrescriptionItemAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.UpdatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = UserMapper.class
)
public interface PrescriptionItemMapper {

    PrescriptionItem createRequestDTOtoEntity(CreatePrescriptionItemRequestDTO requestDTO);

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
    PrescriptionItemDetailsDTO entityToDetailsDTO(PrescriptionItem item);

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
            target = "createdByUserId",
            source = "user.userId"
    )
    PrescriptionItemAuditDTO entityToAuditDTO(PrescriptionItem item);

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
            target = "createdByUserId",
            source = "user.userId"
    )
    List<PrescriptionItemAuditDTO> entityListToAuditDTOList(List<PrescriptionItem> item);

    @BeanMapping(nullValuePropertyMappingStrategy =
            NullValuePropertyMappingStrategy.IGNORE)
    void updatePrescriptionItemFromDTO(UpdatePrescriptionItemRequestDTO updatedItem, @MappingTarget PrescriptionItem prescriptionItem);
}
