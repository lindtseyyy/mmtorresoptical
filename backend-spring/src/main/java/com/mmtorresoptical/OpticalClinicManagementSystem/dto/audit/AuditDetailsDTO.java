package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AuditDetailsDTO {

    private UUID logId;
    private String actionType;
    private String resourceType;
    private UUID resourceId;
    private String details;
    private String detailsJson;
    private LocalDateTime loggedAt;
    private UUID userId;

}