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
    @Mapping(target = "status",
            expression = "java(eyeExam.getStatus() != null ? eyeExam.getStatus().name() : null)")
    EyeExamResponseDTO entityToResponseDTO(EyeExam eyeExam);

    EyeExam createDTOToEntity(CreateEyeExamRequestDTO dto);

    @Mapping(target = "performedBy", source = "performedBy")
    @Mapping(target = "voidedBy", source = "voidedBy")
    @Mapping(target = "status",
            expression = "java(eyeExam.getStatus() != null ? eyeExam.getStatus().name() : null)")
    EyeExamDetailsDTO entityToDetailsDTO(EyeExam eyeExam);

    @Mapping(target = "performedByUserId", source = "performedBy.userId")
    @Mapping(target = "status",
            expression = "java(eyeExam.getStatus() != null ? eyeExam.getStatus().name() : null)")
    EyeExamAuditDTO entityToAuditDTO(EyeExam eyeExam);

    List<EyeExamAuditDTO> entityListToAuditDTOList(List<EyeExam> eyeExams);
}
