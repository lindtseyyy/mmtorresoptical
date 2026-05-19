package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.eyeexam.EyeExamAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.CreateEyeExamRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.EyeExamDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.EyeExamResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = UserMapper.class
)
public interface EyeExamMapper {

    @Mapping(target = "performedBy", source = "performedBy")
    EyeExamResponseDTO entityToResponseDTO(EyeExam eyeExam);

    EyeExam createDTOToEntity(CreateEyeExamRequestDTO dto);

    @Mapping(target = "performedBy", source = "performedBy")
    EyeExamDetailsDTO entityToDetailsDTO(EyeExam eyeExam);

    @Mapping(target = "performedByUserId", source = "performedBy.userId")
    EyeExamAuditDTO entityToAuditDTO(EyeExam eyeExam);

    List<EyeExamAuditDTO> entityListToAuditDTOList(List<EyeExam> eyeExams);
}
