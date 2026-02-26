package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.CreateHealthHistoryRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.UpdateHealthHistoryRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.HealthHistoryMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.HealthHistoryRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.HealthHistoryAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.HealthHistorySpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HealthHistoryService {

    private final PatientRepository patientRepository;
    private final HealthHistoryRepository healthHistoryRepository;
    private final HealthHistoryMapper healthHistoryMapper;
    private final AuthenticatedUserService authenticatedUserService;
    private final HealthHistoryAuditHelper healthHistoryAuditHelper;

    public HealthHistoryResponseDTO createHealthHistory( UUID id,
            CreateHealthHistoryRequestDTO createHealthHistoryRequestDTO) {

        // Retrieve the patient
        Patient retrievedPatient = patientRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Patient not found")
        );

        // Retrieve the user who perform the operation
        User authenticatedUser = authenticatedUserService.getCurrentUser();

        HealthHistory healthHistory = healthHistoryMapper.createHistoryDTOToEntity(createHealthHistoryRequestDTO);

        // Setting the user and patient relationship
        healthHistory.setUser(authenticatedUser);
        healthHistory.setPatient(retrievedPatient);

        HealthHistory savedHistory = healthHistoryRepository.save(healthHistory);

        // Audit Logging
        healthHistoryAuditHelper.logCreate(healthHistory);

        return healthHistoryMapper.historyToResponseDTO(savedHistory);
    }

    public Page<HealthHistoryDetailsDTO> getAllHistoryDetails(UUID patientId,
                                                              String keyword,
                                                              LocalDate minDate,
                                                              LocalDate maxDate,
                                                              int page,
                                                              int size,
                                                              String sortBy,
                                                              String sortOrder,
                                                              String archivedStatus) {

        Specification<HealthHistory> spec = Specification.allOf();

        if (keyword != null && UUIDUtils.isUUID(keyword)) {

            Optional<HealthHistory> healthHistory =
                    healthHistoryRepository.findById(UUID.fromString(keyword));

            if (healthHistory.isEmpty()) {
                return Page.empty();
            }

            return new PageImpl<>(
                    List.of(healthHistoryMapper.historyToDetailsDTO(healthHistory.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    HealthHistorySpecification.dateBetween(minDate, maxDate)
            );
        }

        spec = spec.and(
                HealthHistorySpecification.hasArchivedStatus(archivedStatus)
        );

        spec = spec.and(
                HealthHistorySpecification.hasPatientId(patientId)
        );

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

        // Retrieve histories for the patient
        Page<HealthHistory> healthHistories = healthHistoryRepository.findAll(spec, pageable);

        // Map entities to detailed DTO responses
        return healthHistories.map(healthHistoryMapper::historyToDetailsDTO);
    }

    public HealthHistoryDetailsDTO getHealthHistory(UUID id) {
        // Retrieve health history or throw exception if not found
        HealthHistory retrievedHealthHistory = healthHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Health History not found with id: " + id));

        // Map entity to detailed response DTO
        return healthHistoryMapper.historyToDetailsDTO(retrievedHealthHistory);
    }

    public HealthHistoryDetailsDTO updateHealthHistory(UUID id, UpdateHealthHistoryRequestDTO updateHealthHistoryRequestDTO) {
        // Retrieve health history or throw exception if not found
        HealthHistory retrievedHealthHistory = healthHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Health History not found with id: " + id));

        // Create a copy for logging (BEFORE snapshot)
        HealthHistory beforeUpdate = new HealthHistory();
        BeanUtils.copyProperties(retrievedHealthHistory, beforeUpdate);

        // Apply updates from DTO to entity
        healthHistoryMapper.updateHistoryFromDTO(updateHealthHistoryRequestDTO, retrievedHealthHistory);

        // Apply updates from DTO to entity
        HealthHistory updatedHealthHistory = healthHistoryRepository.save(retrievedHealthHistory);

        // Audit logging
        healthHistoryAuditHelper.logUpdate(beforeUpdate, updatedHealthHistory);

        // Map entity to detailed response DTO
        return healthHistoryMapper.historyToDetailsDTO(updatedHealthHistory);
    }

    public void archiveHealthHistory(UUID id) {
        // Retrieve health history or throw exception if not found
        HealthHistory retrievedHealthHistory = healthHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Health History not found with id: " + id));

        // Mark health history as archived (soft delete)
        retrievedHealthHistory.setIsArchived(true);

        // Persist archive update
        healthHistoryRepository.save(retrievedHealthHistory);

        // Audit Logging
        healthHistoryAuditHelper.logArchive(retrievedHealthHistory);
    }

    public void restoreHealthHistory(UUID id) {
        // Retrieve health history or throw exception if not found
        HealthHistory retrievedHealthHistory = healthHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Health History not found with id: " + id));

        // Mark health history as active
        retrievedHealthHistory.setIsArchived(false);

        // Persist archive update
        healthHistoryRepository.save(retrievedHealthHistory);

        // Audit Logging
        healthHistoryAuditHelper.logRestore(retrievedHealthHistory);
    }

}
