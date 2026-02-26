package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.AuditDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLogService auditLogService;

    @GetMapping
    public Page<AuditDetailsDTO> getAllAuditLogs(
            @RequestParam(required = false)String keyword,
            @RequestParam(required = false)ActionType actionType,

            @RequestParam(required = false) ResourceType resourceType,
            @RequestParam(required = false) UUID resourceId,

            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) LocalDate minDate,
            @RequestParam(required = false) LocalDate maxDate,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,

            @RequestParam(defaultValue = "loggedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {

        Page<AuditDetailsDTO> auditDetails = auditLogService.getAllAuditLogs(
                keyword,
                actionType,
                resourceType,
                resourceId,
                userId,
                minDate,
                maxDate,
                page,
                size,
                sortBy,
                sortOrder
        );

        return auditDetails;
    }

}
