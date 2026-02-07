package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
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

    PatientDetailsDTO toDetails(Patient patient);
}
