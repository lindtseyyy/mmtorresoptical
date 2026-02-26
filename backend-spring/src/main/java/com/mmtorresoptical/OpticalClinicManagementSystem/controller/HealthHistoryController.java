package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.CreateHealthHistoryRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.UpdateHealthHistoryRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.HealthHistoryMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.UserMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.HealthHistoryRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.HealthHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class HealthHistoryController {

    private final HealthHistoryService healthHistoryService;


    /**
     * Creates a new health history record for a specific patient.
     *
     * This endpoint:
     * - Retrieves the patient based on the provided ID
     * - Identifies the authenticated user who performs the operation
     * - Saves the health history record
     * - Returns the created record with creator details
     *
     * Accessible only by users with ADMIN role.
     *
     * @param createHealthHistoryRequestDTO the request payload containing health history details
     * @return ResponseEntity containing the created HealthHistoryResponseDTO
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("api/admin/patients/{id}/health-histories")
    public ResponseEntity<HealthHistoryResponseDTO> createHealthHistory(@PathVariable UUID id, @Valid @RequestBody CreateHealthHistoryRequestDTO createHealthHistoryRequestDTO) {

        HealthHistoryResponseDTO healthHistoryResponseDTO = healthHistoryService.createHealthHistory(id, createHealthHistoryRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(healthHistoryResponseDTO);
    }

    /**
     * Retrieves paginated and sorted health history records
     * for a specific patient.
     *
     * This endpoint:
     * - Filters records by patient ID
     * - Excludes archived health histories
     * - Supports pagination
     * - Supports sorting by specified fields
     * - Maps entities to detailed response DTOs
     *
     * Accessible only by users with ADMIN role.
     *
     * @param patientId the unique identifier of the patient
     * @param page the page number (default = 0)
     * @param size the number of records per page (default = 10)
     * @param sortBy the field used for sorting (default = examDate)
     * @param sortOrder the sorting direction: ascending or descending (default = descending)
     * @return ResponseEntity containing a page of HealthHistoryDetailsDTO
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("api/admin/patients/{id}/health-histories")
    public ResponseEntity<Page<HealthHistoryDetailsDTO>> getAllPatientHealthHistories(@PathVariable UUID id,
                                                                               @RequestParam(required = false) String keyword,
                                                                               @RequestParam(required = false) LocalDate minExamDate,
                                                                               @RequestParam(required = false) LocalDate maxExamDate,
                                                                               @RequestParam(defaultValue = "0") int page,
                                                                                      @RequestParam(defaultValue = "10") int size, @RequestParam(defaultValue = "examDate") String sortBy,
                                                                          @RequestParam(defaultValue = "desc") String sortOrder,
                                                                                      @RequestParam(defaultValue = "ACTIVE") String archivedStatus) {

        Page<HealthHistoryDetailsDTO> healthHistoryDetailsDTOS = healthHistoryService.getAllHistoryDetails(
                id,
                keyword,
                minExamDate,
                maxExamDate,
                page,
                size,
                sortBy,
                sortOrder,
                archivedStatus);

        return ResponseEntity.ok(healthHistoryDetailsDTOS);
    }

    /**
     * Retrieves detailed information for a specific health history record by ID.
     *
     * This endpoint:
     * - Finds the health history using the provided ID
     * - Throws an exception if the record does not exist
     * - Maps the entity to a detailed response DTO
     *
     * Accessible only by users with ADMIN role.
     *
     * @param id the unique identifier of the health history record
     * @return ResponseEntity containing HealthHistoryDetailsDTO
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("api/admin/health-histories/{id}")
    public ResponseEntity<HealthHistoryDetailsDTO> getPatientHealthHistory(@PathVariable UUID id) {

        HealthHistoryDetailsDTO healthHistoryDetailsDTO = healthHistoryService.getHealthHistory(id);

        return ResponseEntity.ok(healthHistoryDetailsDTO);
    }

    /**
     * Updates an existing health history record by ID.
     *
     * This endpoint:
     * - Retrieves the health history record
     * - Applies updates from the request DTO
     * - Persists the updated record
     * - Returns the updated details
     *
     * Accessible only by users with ADMIN role.
     *
     * @param id the unique identifier of the health history record
     * @param updateHealthHistoryRequestDTO the request payload containing updated health history details
     * @return ResponseEntity containing HealthHistoryDetailsDTO
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("api/admin/health-histories/{id}")
    public ResponseEntity<HealthHistoryDetailsDTO> updateHealthHistory(@PathVariable UUID id,
                                                                           @Valid @RequestBody UpdateHealthHistoryRequestDTO updateHealthHistoryRequestDTO) {


        HealthHistoryDetailsDTO healthHistoryDetailsDTO = healthHistoryService.updateHealthHistory(id, updateHealthHistoryRequestDTO);

        return ResponseEntity.ok(healthHistoryDetailsDTO);
    }

    /**
     * Archives a health history record by ID.
     *
     * This endpoint performs a soft delete by:
     * - Retrieving the health history record
     * - Marking it as archived
     * - Persisting the update
     *
     * The record remains in the database but is excluded
     * from active queries.
     *
     * @param id the unique identifier of the health history record
     * @return ResponseEntity with no content
     */
    @DeleteMapping("api/admin/health-histories/{id}")
    public ResponseEntity<Void> archiveHealthHistory(@PathVariable UUID id) {

        healthHistoryService.archiveHealthHistory(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * Restores an archived health history record by ID.
     *
     * This endpoint:
     * - Retrieves the health history record
     * - Marks it as active (unarchived)
     * - Persists the update
     *
     * Used to reverse a soft delete operation and make
     * the record visible again in active queries.
     *
     * @param id the unique identifier of the health history record
     * @return ResponseEntity with no content
     */
    @PutMapping("api/admin/health-histories/{id}/restore")
    public ResponseEntity<Void> restoreHealthHistory(@PathVariable UUID id) {
        healthHistoryService.restoreHealthHistory(id);

        return ResponseEntity.noContent().build();
    }
}
