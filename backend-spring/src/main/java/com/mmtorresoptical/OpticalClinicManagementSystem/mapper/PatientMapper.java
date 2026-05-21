package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.patient.PatientAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientSearchResultDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PatientMapper {

    @Mapping(
            target = "sex",
            expression = "java(patient.getSex().name())"
    )
    PatientResponseDTO entityToResponse(Patient patient);

    @Mapping(
            target = "sex",
            expression = "java(patient.getSex().name())"
    )
    PatientDetailsDTO entityToDetailedResponse(Patient patient);

    @Mapping(
            target = "sex",
            expression = "java(patient.getSex().name())"
    )
    PatientAuditDTO entityToAuditDTO(Patient patient);

    Patient dtoToPatient(PatientRequestDTO patientRequest);

    @BeanMapping(nullValuePropertyMappingStrategy =
            NullValuePropertyMappingStrategy.IGNORE)
    void updatePatientFromDto(PatientRequestDTO patientRequest, @MappingTarget Patient patient);

    @Mapping(
            target = "fullName",
            expression = "java(buildFullName(patient.getFirstName(), patient.getMiddleName(), patient.getLastName()))"

    )
    PatientSummaryDTO entityToSummaryDTO(Patient patient);

    @Mapping(
            target = "fullName",
            expression = "java(buildFullName(patient.getFirstName(), patient.getMiddleName(), patient.getLastName()))"
    )
    PatientSearchResultDTO entityToSearchResultDTO(Patient patient);

    default String buildFullName(
            String first,
            String middle,
            String last
    ) {
        StringBuilder name = new StringBuilder();

        if (first != null && !first.isBlank()) {
            name.append(first).append(" ");
        }

        if (middle != null && !middle.isBlank()) {
            name.append(middle).append(" ");
        }

        if (last != null && !last.isBlank()) {
            name.append(last);
        }

        return name.toString().trim();
    }
}
