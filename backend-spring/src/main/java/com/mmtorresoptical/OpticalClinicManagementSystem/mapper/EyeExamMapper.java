package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.eyeexam.EyeExamAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

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

    @AfterMapping
    default void populateNestedFromFlatForResponse(EyeExam eyeExam, @MappingTarget EyeExamResponseDTO dto) {
        dto.setClinicalMetrics(buildClinicalMetrics(eyeExam));
        dto.setExaminations(buildExaminations(eyeExam));
    }

    @AfterMapping
    default void populateNestedFromFlatForDetails(EyeExam eyeExam, @MappingTarget EyeExamDetailsDTO dto) {
        dto.setClinicalMetrics(buildClinicalMetrics(eyeExam));
        dto.setExaminations(buildExaminations(eyeExam));
    }

    private ClinicalMetricsDTO buildClinicalMetrics(EyeExam eyeExam) {
        MeasurementDTO uncorrected = new MeasurementDTO(
                eyeExam.getVaUnconvertedOd(),
                eyeExam.getVaUnconvertedOs()
        );
        MeasurementDTO aided = new MeasurementDTO(
                eyeExam.getVaAidedOd(),
                eyeExam.getVaAidedOs()
        );
        VisualAcuityDTO visualAcuity = new VisualAcuityDTO(uncorrected, aided);
        IntraocularPressureDTO iop = new IntraocularPressureDTO(
                eyeExam.getIopOd(),
                eyeExam.getIopOs()
        );
        return new ClinicalMetricsDTO(visualAcuity, iop);
    }

    private ExaminationsDTO buildExaminations(EyeExam eyeExam) {
        return new ExaminationsDTO(
                eyeExam.getSlitLampExamination(),
                eyeExam.getFundusExamination()
        );
    }
}
