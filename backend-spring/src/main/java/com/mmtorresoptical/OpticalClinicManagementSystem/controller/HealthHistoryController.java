package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.HealthHistoryMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.UserMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.HealthHistoryRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/health-history")
public class HealthHistoryController {

    private final HealthHistoryRepository healthHistoryRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final HealthHistoryMapper healthHistoryMapper;
    private final UserMapper userMapper;

    HealthHistoryController(HealthHistoryRepository healthHistoryRepository,
                            UserRepository userRepository,
                            PatientRepository patientRepository,
                            HealthHistoryMapper healthHistoryMapper,
                            UserMapper userMapper) {
        this.healthHistoryRepository = healthHistoryRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.healthHistoryMapper = healthHistoryMapper;
        this.userMapper = userMapper;
    }

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
     * @param healthHistoryRequestDTO the request payload containing health history details
     * @return ResponseEntity containing the created HealthHistoryResponseDTO
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<HealthHistoryResponseDTO> createHealthHistory(@Valid @RequestBody HealthHistoryRequestDTO healthHistoryRequestDTO) {

        // Retrieve the patient
        Patient retrievedPatient = patientRepository.findById(
                healthHistoryRequestDTO.getPatientId()
        ).orElseThrow(() ->
                new ResourceNotFoundException("Patient not found")
        );

        // Retrieve the user who perform the operation
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        UUID userId = user.getUserId();
        User retrievedUser = userRepository.findById(userId).orElseThrow(() ->
                new ResourceNotFoundException("User not found")
        );

        HealthHistory healthHistory = getHealthHistory(healthHistoryRequestDTO, retrievedPatient, retrievedUser);

        HealthHistory savedHistory = healthHistoryRepository.save(healthHistory);

        HealthHistoryResponseDTO response = healthHistoryMapper.historyToResponseDTO(savedHistory);

        // Setting the createdBy
        UserDTO userDTO = userMapper.entityToDTO(retrievedUser);
        response.setCreatedBy(userDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<Page<HealthHistoryDetailsDTO>> getAllPatientHealthHistories(@PathVariable UUID patientId,
                                                                               @RequestParam(defaultValue = "0") int page,
                                                                          @RequestParam(defaultValue = "10") int size,
                                                                          @RequestParam(defaultValue = "examDate") String sortBy,
                                                                          @RequestParam(defaultValue = "descending") String sortOrder) {

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // Retrieve non-archived health histories for the patient
        Page<HealthHistory> healthHistories = healthHistoryRepository.findAllByIsArchivedFalseAndPatient_PatientId(patientId, pageable);

        // Map entities to detailed DTO responses
        Page<HealthHistoryDetailsDTO> healthHistoryDetailsDTOS = healthHistories.map(healthHistoryMapper::historyToDetailsDTO);

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
    @GetMapping("/{id}")
    public ResponseEntity<HealthHistoryDetailsDTO> getPatientHealthHistory(@PathVariable UUID id) {
        // Retrieve health history or throw exception if not found
        HealthHistory retrievedHealthHistory = healthHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Health History not found with id: " + id));

        // Map entity to detailed response DTO
        HealthHistoryDetailsDTO healthHistoryDetailsDTO = healthHistoryMapper.historyToDetailsDTO(retrievedHealthHistory);

        return ResponseEntity.ok(healthHistoryDetailsDTO);
    }




    /**
     * Constructs a HealthHistory entity using the provided request DTO.
     *
     * This method:
     * - Maps health history fields from the request
     * - Sets the associated patient
     * - Sets the user who created the record
     *
     * @param healthHistoryRequestDTO the request data containing health history details
     * @param retrievedPatient the patient linked to this health history
     * @param retrievedUser the user who created the record
     * @return a populated HealthHistory entity ready for saving
     */
    private static HealthHistory getHealthHistory(HealthHistoryRequestDTO healthHistoryRequestDTO, Patient retrievedPatient, User retrievedUser) {
        HealthHistory healthHistory = new HealthHistory();
        // Setting the relationship
        healthHistory.setPatient(retrievedPatient);
        healthHistory.setUser(retrievedUser);

        // Setting the health history fields
        healthHistory.setExamDate(healthHistoryRequestDTO.getExamDate());
        healthHistory.setEyeConditions(healthHistoryRequestDTO.getEyeConditions());
        healthHistory.setSystemicConditions(healthHistoryRequestDTO.getSystemicConditions());
        healthHistory.setMedications(healthHistoryRequestDTO.getMedications());
        healthHistory.setAllergies(healthHistoryRequestDTO.getAllergies());
        healthHistory.setVisualAcuityLeft(healthHistoryRequestDTO.getVisualAcuityLeft());
        healthHistory.setVisualAcuityRight(healthHistoryRequestDTO.getVisualAcuityRight());
        healthHistory.setNotes(healthHistoryRequestDTO.getNotes());
        return healthHistory;
    }
}
