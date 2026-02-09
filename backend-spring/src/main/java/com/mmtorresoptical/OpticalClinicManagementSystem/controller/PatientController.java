package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PatientMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.HmacHashService;
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
    private final HmacHashService hmacHashService;

    PatientController(PatientRepository patientRepository, PatientMapper mapper, HmacHashService hmacHashService) {
        this.patientRepository = patientRepository;
        this.mapper = mapper;
        this.hmacHashService = hmacHashService;
    }

    /**
     * CREATE a new patient
     */
    @PostMapping
    public ResponseEntity<Object> createPatient(@Valid @RequestBody PatientRequestDTO patientRequest) {

        if(patientExists(patientRequest.getFirstName(), patientRequest.getMiddleName(), patientRequest.getLastName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Patient's name is already existing in the records.");
        }

        Patient patient = new Patient();
        patient.setFirstName(patientRequest.getFirstName());
        patient.setMiddleName(patientRequest.getMiddleName());
        patient.setLastName(patientRequest.getLastName());

        String firstNameHash = hmacHashService.hash(patientRequest.getFirstName());
        String middleNameHash = hmacHashService.hash(patientRequest.getMiddleName());
        String lastNameHash = hmacHashService.hash(patientRequest.getLastName());
        patient.setFirstNameHash(firstNameHash);
        patient.setMiddleNameHash(middleNameHash);
        patient.setLastNameHash(lastNameHash);
        System.out.println("First Name Hash: " + patient.getFirstNameHash());

        patient.setGender(Gender.valueOf(patientRequest.getGender()));
        patient.setContactNumber(patientRequest.getContactNumber());
        patient.setEmail(patientRequest.getEmail());
        patient.setBirthDate(patientRequest.getBirthDate());
        patient.setAddress(patientRequest.getAddress());

        Patient savedPatient = patientRepository.save(patient);
        System.out.println(savedPatient.getFirstName());

        PatientResponseDTO response = mapper.toResponse(savedPatient);
        System.out.println(response.getFirstName());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private boolean patientExists(
            String firstName,
            String middleName,
            String lastName
    ) {

        String firstHash = hmacHashService.hash(firstName);
        String middleHash = hmacHashService.hash(middleName);
        String lastHash = hmacHashService.hash(lastName);

        return patientRepository.existsByFirstNameHashAndMiddleNameHashAndLastNameHash(
                firstHash,
                middleHash,
                lastHash
        );
    }

}
