package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.LensSpecificationDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionLensDetail;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PrescriptionLensDetailMapper {

    LensSpecificationDTO entityToDTO(PrescriptionLensDetail entity);

    List<LensSpecificationDTO> entityListToDTOList(List<PrescriptionLensDetail> entities);
}
