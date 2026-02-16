package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

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
    private final HealthHistoryMapper mapper;
    private final UserMapper userMapper;

    HealthHistoryController(HealthHistoryRepository healthHistoryRepository,
                            UserRepository userRepository,
                            PatientRepository patientRepository,
                            HealthHistoryMapper mapper,
                            UserMapper userMapper) {
        this.healthHistoryRepository = healthHistoryRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.mapper = mapper;
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

        HealthHistoryResponseDTO response = mapper.historyToResponseDTO(savedHistory);

        // Setting the createdBy
        UserDTO userDTO = userMapper.entityToDTO(retrievedUser);
        response.setCreatedBy(userDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

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
