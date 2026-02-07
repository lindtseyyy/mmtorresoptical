package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PatientMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patientRepository;
    private final PatientMapper mapper;

    PatientController(PatientRepository patientRepository, PatientMapper mapper) {
        this.patientRepository = patientRepository;
        this.mapper = mapper;
    }

    /**
     * CREATE a new patient
     */
    @PostMapping
    public ResponseEntity<Object> createPatient(@Valid @RequestBody PatientRequestDTO patientRequest) {

        Patient patient = new Patient();
        patient.setFirstName(patientRequest.getFirstName());
        patient.setMiddleName(patientRequest.getMiddleName());
        patient.setLastName(patientRequest.getLastName());
        patient.setGender(Gender.valueOf(patientRequest.getGender()));
        patient.setContactNumber(patientRequest.getContactNumber());
        patient.setEmail(patientRequest.getEmail());
        patient.setBirthDate(patientRequest.getBirthDate());
        patient.setAddress(patientRequest.getAddress());

        Patient savedPatient = patientRepository.save(patient);

        PatientResponseDTO response = mapper.toResponse(savedPatient);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
