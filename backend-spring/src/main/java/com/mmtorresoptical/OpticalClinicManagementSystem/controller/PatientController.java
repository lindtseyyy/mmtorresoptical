package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PatientMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.HmacHashService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

        patient.setGender(Gender.valueOf(patientRequest.getGender()));
        patient.setContactNumber(patientRequest.getContactNumber());
        patient.setEmail(patientRequest.getEmail());
        patient.setBirthDate(patientRequest.getBirthDate());
        patient.setAddress(patientRequest.getAddress());

        Patient savedPatient = patientRepository.save(patient);

        PatientResponseDTO response = mapper.toResponse(savedPatient);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * READ all non-archived patients
     */
    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> retrievedPatients = patientRepository.findAllByIsArchivedFalse();

        return ResponseEntity.ok(retrievedPatients);
    }

    /**
     * READ a single patient by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getUserById(@PathVariable UUID id) {
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        return ResponseEntity.ok(retrievedPatient);
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
