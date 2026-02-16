package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.HealthHistoryMapper;
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

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patientRepository;
    private final PatientMapper mapper;
    private final HealthHistoryMapper healthHistoryMapper;
    private final HmacHashService hmacHashService;

    PatientController(PatientRepository patientRepository, PatientMapper mapper, HealthHistoryMapper healthHistoryMapper, HmacHashService hmacHashService) {
        this.patientRepository = patientRepository;
        this.mapper = mapper;
        this.healthHistoryMapper = healthHistoryMapper;
        this.hmacHashService = hmacHashService;
    }

    /**
     * CREATE a new patient
     */
    @PostMapping
    public ResponseEntity<Object> createPatient(@Valid @RequestBody PatientRequestDTO patientRequest) {

        if(patientExistsByFirstMiddleLastName(patientRequest.getFirstName(), patientRequest.getMiddleName(), patientRequest.getLastName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Patient's name is already existing in the records.");
        }

        if(patientExistsByEmail(patientRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Patient's email is already existing in the records.");
        }

        Patient patient = new Patient();

        // Setting the names
        patient.setFirstName(patientRequest.getFirstName());
        patient.setMiddleName(patientRequest.getMiddleName());
        patient.setLastName(patientRequest.getLastName());

        String firstNameHash = hmacHashService.hash(patientRequest.getFirstName());
        String middleNameHash = hmacHashService.hash(patientRequest.getMiddleName());
        String lastNameHash = hmacHashService.hash(patientRequest.getLastName());

        patient.setFirstNameHash(firstNameHash);
        patient.setMiddleNameHash(middleNameHash);
        patient.setLastNameHash(lastNameHash);

        // Setting gender
        patient.setGender(Gender.valueOf(patientRequest.getGender()));

        // Setting contact number
        patient.setContactNumber(patientRequest.getContactNumber());

        // Setting email
        patient.setEmail(patientRequest.getEmail());
        String emailHash = hmacHashService.hash(patientRequest.getEmail());
        patient.setEmailHash(emailHash);

        // Setting birthdate
        patient.setBirthDate(patientRequest.getBirthDate());

        // Setting address
        patient.setAddress(patientRequest.getAddress());

        // Setting full name sortable
        patient.setFullNameSortable(generateFullNameSortable(patient.getFirstName(),patient.getMiddleName(), patient.getLastName()));

        // Saving the patient
        Patient savedPatient = patientRepository.save(patient);

        // Mapping the patient entity to responseDTO
        PatientResponseDTO response = mapper.entityToResponse(savedPatient);

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

        Page<PatientDetailsDTO> patientDetailsDTOS = retrievedPatients.map(mapper::entityToDetailedResponse);

        return ResponseEntity.ok(patientDetailsDTOS);
    }

    /**
     * READ a single patient by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PatientDetailsDTO> getUserById(@PathVariable UUID id) {
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        PatientDetailsDTO responseDetails = mapper.entityToDetailedResponse(retrievedPatient);

        Set<HealthHistoryDetailsDTO> historyDTOs =
                retrievedPatient.getHealthHistory()
                        .stream()
                        .map(healthHistoryMapper::historyToDetailsDTO)
                        .collect(Collectors.toSet());

        responseDetails.setHealthHistory(historyDTOs);

        return ResponseEntity.ok(responseDetails);
    }

    /**
     * UPDATE an existing patient
     */
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateUser(@PathVariable UUID id, @Valid @RequestBody PatientRequestDTO patientRequest) {
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));


        // CHECK NAME CONFLICT
        String patientRequestFullName = patientRequest.getFirstName() + patientRequest.getMiddleName() + patientRequest.getLastName();
        // The retrieved names here are hashed
        String retrievedPatientFullName = retrievedPatient.getFirstName() + retrievedPatient.getMiddleName() + retrievedPatient.getLastName();

        // Check for conflicts
        if (!retrievedPatientFullName.equals(patientRequestFullName)) {

            boolean isNameExisting = patientExistsByFirstMiddleLastName(patientRequest.getFirstName(), patientRequest.getMiddleName(), patientRequest.getLastName());

            if(isNameExisting) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Name is already taken");
            }

            // Update the full name sortable
            retrievedPatient.setFullNameSortable(generateFullNameSortable(patientRequest.getFirstName(), patientRequest.getMiddleName(), patientRequest.getLastName()));

            // Update the hashed value of the names
            retrievedPatient.setFirstNameHash(hmacHashService.hash(patientRequest.getFirstName()));
            retrievedPatient.setMiddleNameHash(hmacHashService.hash(patientRequest.getMiddleName()));
            retrievedPatient.setLastNameHash(hmacHashService.hash(patientRequest.getLastName()));
        }

        // CHECK EMAIL CONFLICT
        if(!retrievedPatient.getEmail().equals(patientRequest.getEmail())) {

            boolean isEmailExisting = patientExistsByEmail(patientRequest.getEmail());

            if (isEmailExisting) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already in use");
            }

        }

        // Perform the changes
        mapper.updatePatientFromDto(patientRequest, retrievedPatient);

        Patient updatedPatient = patientRepository.save(retrievedPatient);

        PatientResponseDTO response = mapper.entityToResponse(updatedPatient);

        return ResponseEntity.ok(response);
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

    @GetMapping("/search")
    public ResponseEntity<Page<PatientDetailsDTO>> searchPatients (
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Patient> patientPage = patientRepository.findAllByFullNameSortableContainingIgnoreCase(keyword, pageable);

        Page<PatientDetailsDTO> patientDetailsDTOPage = patientPage.map(mapper::entityToDetailedResponse);

        return ResponseEntity.ok(patientDetailsDTOPage);
    }

    private boolean patientExistsByFirstMiddleLastName(
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

    private boolean patientExistsByEmail(
            String email
    ) {

        String emailHash = hmacHashService.hash(email);

        return patientRepository.existsByEmailHash(
                emailHash
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
