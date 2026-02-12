package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PatientMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.HmacHashService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

        patient.setFullNameSortable(generateFullNameSortable(patient.getFirstName(),patient.getMiddleName(), patient.getLastName()));

        Patient savedPatient = patientRepository.save(patient);

        PatientResponseDTO response = mapper.toResponse(savedPatient);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * READ all non-archived patients
     */
    @GetMapping
    public ResponseEntity<Page<PatientDetailsDTO>> getAllPatients(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "10") int size,
                                                        @RequestParam(defaultValue = "fullNameSortable") String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());

        Page<Patient> retrievedPatients = patientRepository.findAllByIsArchivedFalse(pageable);

        Page<PatientDetailsDTO> patientDetailsDTOS = retrievedPatients.map(mapper::toDetails);

        return ResponseEntity.ok(patientDetailsDTOS);
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

    /**
     * UPDATE an existing patient
     */
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateUser(@PathVariable UUID id, @Valid @RequestBody PatientRequestDTO patientRequest) {
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        String patientRequestFullName = hmacHashService.hash(patientRequest.getFirstName()) + hmacHashService.hash(patientRequest.getMiddleName()) + hmacHashService.hash(patientRequest.getLastName());
        String retrievedPatientFullName = retrievedPatient.getFirstName() + retrievedPatient.getMiddleName() + retrievedPatient.getLastName();
        // Check for conflicts
        if (!retrievedPatientFullName.equals(patientRequestFullName) && patientRepository.findPatientByFirstNameAndMiddleNameAndLastName(patientRequest.getFirstName(), patientRequest.getMiddleName(), patientRequest.getLastName()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Name is already taken");
        }

        // Check for conflicts
        if (!retrievedPatient.getEmail().equals(patientRequest.getEmail()) && patientRepository.findPatientByEmail(retrievedPatient.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already in use");
        }

        retrievedPatient = mapper.dtoToPatient(patientRequest);

        retrievedPatient.setFirstNameHash(retrievedPatient.getFirstName());
        retrievedPatient.setMiddleNameHash(retrievedPatient.getMiddleName());
        retrievedPatient.setLastNameHash(retrievedPatient.getLastName());

        Patient updatedPatient = patientRepository.save(retrievedPatient);
        return ResponseEntity.ok(updatedPatient);
    }

    /**
     * ARCHIVE a patient (Soft Delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveUser(@PathVariable UUID id) {
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        retrievedPatient.setIsArchived(true);
        patientRepository.save(retrievedPatient);

        return ResponseEntity.noContent().build();
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

    private String generateFullNameSortable(
            String firstName,
            String middleName,
            String lastName
    ) {
        if (firstName == null || lastName == null) {
            return null;
        }

        String fullName =
                firstName + " " +
                        (middleName != null ? middleName : "") + " " +
                        lastName;

        return fullName
                .trim()
                .replaceAll("\\s+", " ")
                .toUpperCase();
    }

}
