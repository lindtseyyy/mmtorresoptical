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

import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final HealthHistoryMapper healthHistoryMapper;
    private final HmacHashService hmacHashService;

    PatientController(PatientRepository patientRepository, PatientMapper patientMapper, HealthHistoryMapper healthHistoryMapper, HmacHashService hmacHashService) {
        this.patientRepository = patientRepository;
        this.patientMapper = patientMapper;
        this.healthHistoryMapper = healthHistoryMapper;
        this.hmacHashService = hmacHashService;
    }

    /**
     * Creates a new patient record.
     *
     * This method:
     * - Validates if the patient name already exists
     * - Validates if the email is already registered
     * - Hashes sensitive data (name and email)
     * - Maps request data to the Patient entity
     * - Saves the patient record to the database
     * - Returns the created patient as a response DTO
     *
     * @param patientRequest the request payload containing patient information
     * @return ResponseEntity containing the created PatientResponseDTO
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

        // Set patient names
        patient.setFirstName(patientRequest.getFirstName());
        patient.setMiddleName(patientRequest.getMiddleName());
        patient.setLastName(patientRequest.getLastName());

        // Generate HMAC hashes for sensitive name fields
        String firstNameHash = hmacHashService.hash(patientRequest.getFirstName());
        String middleNameHash = Optional.ofNullable(patientRequest.getMiddleName())
                .filter(name -> !name.isBlank())
                .map(hmacHashService::hash)
                .orElse(null);

        String lastNameHash = hmacHashService.hash(patientRequest.getLastName());

        patient.setFirstNameHash(firstNameHash);
        patient.setMiddleNameHash(middleNameHash);
        patient.setLastNameHash(lastNameHash);

        // Set patient gender
        patient.setGender(Gender.valueOf(patientRequest.getGender()));

        // Set contact information
        patient.setContactNumber(patientRequest.getContactNumber());

        // Set email and generate its hash
        patient.setEmail(patientRequest.getEmail());
        String emailHash = hmacHashService.hash(patientRequest.getEmail());
        patient.setEmailHash(emailHash);

        // Set birth date
        patient.setBirthDate(patientRequest.getBirthDate());

        // Set patient address
        patient.setAddress(patientRequest.getAddress());

        // Set archive status
        patient.setIsArchived(patientRequest.getIsArchived());

        // Generate sortable full name for indexing/search
        patient.setFullNameSortable(generateFullNameSortable(patient.getFirstName(),patient.getMiddleName(), patient.getLastName()));

        // Persist patient record
        Patient savedPatient = patientRepository.save(patient);

        // Map entity to response DTO
        PatientResponseDTO response = patientMapper.entityToResponse(savedPatient);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves a paginated and sorted list of all non-archived patients.
     *
     * This endpoint:
     * - Filters out archived patient records
     * - Supports pagination (page, size)
     * - Supports sorting by a specified field
     * - Maps patient entities to detailed response DTOs
     *
     * @param page the page number (default = 0)
     * @param size the number of records per page (default = 10)
     * @param sortBy the field used for sorting (default = fullNameSortable)
     * @return ResponseEntity containing a page of PatientDetailsDTO
     */
    @GetMapping
    public ResponseEntity<Page<PatientDetailsDTO>> getAllPatients(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "10") int size,
                                                        @RequestParam(defaultValue = "fullNameSortable") String sortBy) {
        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());

        // Retrieve non-archived patients
        Page<Patient> retrievedPatients = patientRepository.findAllByIsArchivedFalse(pageable);

        // Map entities to detailed DTO responses
        Page<PatientDetailsDTO> patientDetailsDTOS = retrievedPatients.map(patientMapper::entityToDetailedResponse);

        return ResponseEntity.ok(patientDetailsDTOS);
    }

    /**
     * Retrieves detailed information for a specific patient by ID.
     *
     * This endpoint:
     * - Finds the patient using the provided ID
     * - Throws an exception if the patient does not exist
     * - Maps the patient entity to a detailed response DTO
     * - Includes associated health history records
     *
     * @param id the unique identifier of the patient
     * @return ResponseEntity containing PatientDetailsDTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<PatientDetailsDTO> getPatientById(@PathVariable UUID id) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Map patient entity to detailed DTO
        PatientDetailsDTO responseDetails = patientMapper.entityToDetailedResponse(retrievedPatient);

        return ResponseEntity.ok(responseDetails);
    }

    /**
     * Updates an existing patient record by ID.
     *
     * This endpoint:
     * - Retrieves the patient by ID
     * - Validates name uniqueness if modified
     * - Validates email uniqueness if modified
     * - Recomputes hashed sensitive fields when needed
     * - Updates patient information
     * - Returns the updated patient record
     *
     * @param id the unique identifier of the patient
     * @param patientRequest the request payload containing updated patient details
     * @return ResponseEntity containing the updated PatientResponseDTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<Object> updatePatient(@PathVariable UUID id, @Valid @RequestBody PatientRequestDTO patientRequest) {

        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));


        /* -----------------------------
           Normalize input values
        ----------------------------- */
        String first = patientRequest.getFirstName();
        String middle = Optional.ofNullable(patientRequest.getMiddleName()).orElse("");
        String last = patientRequest.getLastName();

        /* -----------------------------
           Validate name uniqueness
        ----------------------------- */
        boolean nameChanged =
                !retrievedPatient.getFirstName().equals(first) ||
                        !Objects.equals(retrievedPatient.getMiddleName(), middle)
                        ||
                        !retrievedPatient.getLastName().equals(last);

        if (nameChanged) {

            boolean isNameExisting = patientExistsByFirstMiddleLastName(first, middle, last);

            if(isNameExisting) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Name is already taken");
            }

            // Update sortable full name
            retrievedPatient.setFullNameSortable(generateFullNameSortable(first, middle, last));

            // Update hashed names
            retrievedPatient.setFirstNameHash(hmacHashService.hash(first));
            String middleNameHash = Optional.ofNullable(patientRequest.getMiddleName())
                    .filter(name -> !name.isBlank())
                    .map(hmacHashService::hash)
                    .orElse(null);
            retrievedPatient.setMiddleNameHash(middleNameHash);
            retrievedPatient.setLastNameHash(hmacHashService.hash(last));
        }

        /* -----------------------------
           Validate email uniqueness
        ----------------------------- */
        if(!retrievedPatient.getEmail().equals(patientRequest.getEmail())) {

            boolean isEmailExisting = patientExistsByEmail(patientRequest.getEmail());

            if (isEmailExisting) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already in use");
            }

        }

        /* -----------------------------
           Apply updates to entity
        ----------------------------- */
        patientMapper.updatePatientFromDto(patientRequest, retrievedPatient);

        Patient updatedPatient = patientRepository.save(retrievedPatient);

        PatientResponseDTO response = patientMapper.entityToResponse(updatedPatient);

        return ResponseEntity.ok(response);
    }

    /**
     * Archives a patient record by ID.
     *
     * This endpoint performs a soft delete by:
     * - Retrieving the patient record
     * - Marking it as archived
     * - Persisting the update
     *
     * The record remains in the database but is excluded
     * from active queries.
     *
     * @param id the unique identifier of the patient
     * @return ResponseEntity with no content
     */

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archivePatient(@PathVariable UUID id) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Mark patient as archived (soft delete)
        retrievedPatient.setIsArchived(true);

        // Persist archive update
        patientRepository.save(retrievedPatient);

        return ResponseEntity.noContent().build();
    }

    /**
     * Restores an archived patient record by ID.
     *
     * This endpoint:
     * - Retrieves the patient record
     * - Marks it as active (unarchived)
     * - Persists the update
     *
     * Used to reverse a soft delete operation and make
     * the patient visible again in active records.
     *
     * @param id the unique identifier of the patient
     * @return ResponseEntity with no content
     */
    @PutMapping("/restore/{id}")
    public ResponseEntity<Void> restorePatient(@PathVariable UUID id) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Mark patient as unarchived
        retrievedPatient.setIsArchived(false);

        // Persist unarchive update
        patientRepository.save(retrievedPatient);

        return ResponseEntity.noContent().build();
    }

    /**
     * Searches patients using a keyword.
     *
     * This endpoint:
     * - Performs a case-insensitive search on patient names
     * - Matches against the sortable full name field
     * - Supports pagination
     * - Returns detailed patient information
     *
     * @param keyword the search term used to match patient names
     * @param page the page number (default = 0)
     * @param size the number of records per page (default = 10)
     * @return ResponseEntity containing a page of PatientDetailsDTO
     */
    @GetMapping("/search")
    public ResponseEntity<Page<PatientDetailsDTO>> searchPatients (
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // Configure pagination
        Pageable pageable = PageRequest.of(page, size);

        // Perform keyword search (case-insensitive)
        Page<Patient> patientPage = patientRepository.findAllByFullNameSortableContainingIgnoreCase(keyword, pageable);

        // Map entities to detailed DTO responses
        Page<PatientDetailsDTO> patientDetailsDTOPage = patientPage.map(patientMapper::entityToDetailedResponse);

        return ResponseEntity.ok(patientDetailsDTOPage);
    }

    /**
     * Determines whether a patient record already exists
     * based on first, middle, and last name.
     *
     * This method:
     * - Hashes the provided name fields using HMAC
     * - Handles nullable or blank middle names
     * - Queries the database using hashed values
     *
     * @param firstName the patient's first name
     * @param middleName the patient's middle name (nullable)
     * @param lastName the patient's last name
     * @return true if a matching patient exists; false otherwise
     */
    private boolean patientExistsByFirstMiddleLastName(
            String firstName,
            String middleName,
            String lastName
    ) {

        String firstHash = hmacHashService.hash(firstName);
        String middleHash = Optional.ofNullable(middleName)
                .filter(name -> !middleName.isBlank())
                .map(hmacHashService::hash)
                .orElse(null);
        String lastHash = hmacHashService.hash(lastName);

        return patientRepository.existsByFirstNameHashAndMiddleNameHashAndLastNameHash(
                firstHash,
                middleHash,
                lastHash
        );
    }

    /**
     * Determines whether a patient record already exists
     * based on the provided email address.
     *
     * This method:
     * - Hashes the email using HMAC
     * - Queries the database using the hashed value
     * - Prevents exposure of raw email data
     *
     * @param email the patient's email address
     * @return true if a matching patient exists; false otherwise
     */
    private boolean patientExistsByEmail(
            String email
    ) {

        String emailHash = hmacHashService.hash(email);

        return patientRepository.existsByEmailHash(
                emailHash
        );
    }

    /**
     * Generates a normalized full name string for sorting and search operations.
     *
     * This method:
     * - Combines first, middle, and last names
     * - Handles nullable middle names
     * - Removes extra whitespace
     * - Converts the result to uppercase
     *
     * The output is used for consistent sorting and
     * case-insensitive searching.
     *
     * @param firstName the patient's first name
     * @param middleName the patient's middle name (nullable)
     * @param lastName the patient's last name
     * @return a normalized sortable full name, or null if required fields are missing
     */
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
