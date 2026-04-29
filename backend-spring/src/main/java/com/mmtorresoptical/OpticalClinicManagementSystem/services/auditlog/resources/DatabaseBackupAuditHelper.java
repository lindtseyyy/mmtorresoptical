package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.backup.DatabaseBackupAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DatabaseBackupAuditHelper {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;

    public void logBackup(String filename, long fileSizeBytes) {
        DatabaseBackupAuditDTO dto = new DatabaseBackupAuditDTO(
                "BACKUP",
                filename,
                fileSizeBytes,
                Instant.now()
        );

        String details = "Database backup created: " + filename + " (" + fileSizeBytes + " bytes)";

        auditLogService.log(
                ActionType.BACKUP,
                ResourceType.DATABASE,
                null,
                details,
                jsonService.toJson(dto)
        );
    }

    public void logRestore(String filename, long fileSizeBytes) {
        DatabaseBackupAuditDTO dto = new DatabaseBackupAuditDTO(
                "RESTORE",
                filename,
                fileSizeBytes,
                Instant.now()
        );

        String details = "Database restored from: " + filename + " (" + fileSizeBytes + " bytes)";

        auditLogService.log(
                ActionType.RESTORE,
                ResourceType.DATABASE,
                null,
                details,
                jsonService.toJson(dto)
        );
    }
}
