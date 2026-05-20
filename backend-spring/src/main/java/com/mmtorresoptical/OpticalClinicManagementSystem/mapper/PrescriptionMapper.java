package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescription.PrescriptionAuditDTO;
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

    @Mapping(target = "createdBy", source = "user")
    @Mapping(target = "eyeExamId", source = "eyeExam.eyeExamId")
    @Mapping(target = "eyeExamNumber", source = "eyeExam.examNumber")
    @Mapping(target = "status",
            expression = "java(prescription.getStatus() != null ? prescription.getStatus().name() : null)")
    PrescriptionResponseDTO entityToResponseDTO(Prescription prescription);

    @Mapping(target = "createdByUserId", source = "user.userId")
    @Mapping(target = "eyeExamId", source = "eyeExam.eyeExamId")
    @Mapping(target = "status",
            expression = "java(prescription.getStatus() != null ? prescription.getStatus().name() : null)")
    PrescriptionAuditDTO entityToAuditDTO(Prescription prescription);

    @Mapping(target = "createdBy", source = "user")
    @Mapping(target = "eyeExamId", source = "eyeExam.eyeExamId")
    @Mapping(target = "eyeExamNumber", source = "eyeExam.examNumber")
    @Mapping(target = "status",
            expression = "java(prescription.getStatus() != null ? prescription.getStatus().name() : null)")
    PrescriptionDetailsDTO entityToDetailsDTO(Prescription prescription);

    @Mapping(target = "createdBy", source = "user")
    @Mapping(target = "eyeExamId", source = "eyeExam.eyeExamId")
    @Mapping(target = "eyeExamNumber", source = "eyeExam.examNumber")
    @Mapping(target = "status",
            expression = "java(prescription.getStatus() != null ? prescription.getStatus().name() : null)")
    PrescriptionListDTO entityToListDTO(Prescription prescription);
}
