package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PatientMapper {

    @Mapping(
            target = "gender",
            expression = "java(patient.getGender().name())"
    )
    PatientResponseDTO toResponse(Patient patient);

    @Mapping(
            target = "gender",
            expression = "java(patient.getGender().name())"
    )
    PatientDetailsDTO toDetails(Patient patient);

    Patient dtoToPatient(PatientRequestDTO patientRequest);
}
