package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.AuditDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.AuditMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.AuditLog;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.AuditLogRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.AuditLogSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final AuditMapper auditMapper;

    public void log(ActionType actionType,
                    ResourceType resourceType,
                    UUID resourceId,
                    String details,
                    String detailsJSON) {

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        AuditLog log = new AuditLog();
        log.setUser(authenticatedUser);
        log.setActionType(actionType);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setDetails(details);
        log.setDetailsJson(detailsJSON);

        auditLogRepository.save(log);
    }

    public Page<AuditDetailsDTO> getAllAuditLogs(String keyword,
                                                 ActionType actionType,
                                                 ResourceType resourceType,
                                                 UUID resourceId,
                                                 UUID userId,
                                                 LocalDate minDate,
                                                 LocalDate maxDate,
                                                 int page,
                                                 int size,
                                                 String sortBy,
                                                 String sortOrder) {


        if (keyword != null && UUIDUtils.isUUID(keyword)) {

            Optional<AuditLog> log =
                    auditLogRepository.findById(UUID.fromString(keyword));

            if (log.isEmpty()) {
                return Page.empty();
            }

            return new PageImpl<>(
                    List.of(auditMapper.entityToDetailsDTO(log.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        Specification<AuditLog> spec = Specification.allOf();

        if (actionType != null) {
            spec = spec.and(AuditLogSpecification.hasActionType(actionType));
        }

        if (resourceType != null) {
            spec = spec.and(AuditLogSpecification.hasResourceType(resourceType));
        }

        if (resourceId != null) {
            spec = spec.and(AuditLogSpecification.hasResourceId(resourceId));
        }

        if (userId != null) {
            spec = spec.and(AuditLogSpecification.hasUserId(userId));
        }

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    AuditLogSpecification.dateBetween(minDate, maxDate)
            );
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<AuditLog> auditLogs = auditLogRepository.findAll(spec, pageable);

        return auditLogs.map(auditMapper::entityToDetailsDTO);
    }
}
