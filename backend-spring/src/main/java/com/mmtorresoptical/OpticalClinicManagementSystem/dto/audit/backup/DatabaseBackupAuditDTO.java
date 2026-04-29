package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.backup;

import java.time.Instant;

public record DatabaseBackupAuditDTO(
        String operation,
        String filename,
        Long fileSizeBytes,
        Instant timestamp
) {}
