package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        uses = HealthHistoryMapper.class
)
public interface PatientMapper {

    @Mapping(
            target = "gender",
            expression = "java(patient.getGender().name())"
    )
    PatientResponseDTO entityToResponse(Patient patient);

    @Mapping(
            target = "gender",
            expression = "java(patient.getGender().name())"
    )
    PatientDetailsDTO entityToDetailedResponse(Patient patient);

    Patient dtoToPatient(PatientRequestDTO patientRequest);

    @BeanMapping(nullValuePropertyMappingStrategy =
            NullValuePropertyMappingStrategy.IGNORE)
    void updatePatientFromDto(PatientRequestDTO patientRequest, @MappingTarget Patient patient);
}
