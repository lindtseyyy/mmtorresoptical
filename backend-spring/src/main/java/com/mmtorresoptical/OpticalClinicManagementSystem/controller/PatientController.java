package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/patients")
public class PatientController {

    private final PatientService patientService;

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
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Object> createPatient(@Valid @RequestBody PatientRequestDTO patientRequest) {

        PatientResponseDTO response = patientService.createPatient(patientRequest);

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
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<PatientDetailsDTO>> getAllPatients(@RequestParam(defaultValue = "0") int page,
                                                                  @RequestParam(defaultValue = "10") int size,
                                                                  @RequestParam(defaultValue = "fullNameSortable") String sortBy, Sort sort) {

        Page<PatientDetailsDTO> patientDetailsDTOS = patientService.getAllPatients(page, size, sortBy);

        return ResponseEntity.ok(patientDetailsDTOS);
    }

    /**
     * Retrieves detailed information for a specific patient by ID.
     *
     * This endpoint:
     * - Finds the patient using the provided ID
     * - Throws an exception if the patient does not exist
     * - Maps the patient entity to a detailed response DTO
     *
     * @param id the unique identifier of the patient
     * @return ResponseEntity containing PatientDetailsDTO
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<PatientDetailsDTO> getPatientById(@PathVariable UUID id) {

        PatientDetailsDTO responseDetails = patientService.getPatientById(id);

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
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Object> updatePatient(@PathVariable UUID id, @Valid @RequestBody PatientRequestDTO patientRequest) {

        PatientResponseDTO response = patientService.updatePatient(id, patientRequest);

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
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archivePatient(@PathVariable UUID id) {

        patientService.archivePatient(id);
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
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restorePatient(@PathVariable UUID id) {

        patientService.restorePatient(id);

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
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/search")
    public ResponseEntity<Page<PatientDetailsDTO>> searchPatients (
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        Page<PatientDetailsDTO> patientDetailsDTOPage = patientService.searchPatients(keyword, page, size);

        return ResponseEntity.ok(patientDetailsDTOPage);
    }

}
