package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.backup.DatabaseBackupAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
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
    private final AuthenticatedUserService authenticatedUserService;

    public void logBackup(String filename, long fileSizeBytes) {
        User user = authenticatedUserService.getCurrentUser();
        Instant now = Instant.now();

        DatabaseBackupAuditDTO dto = new DatabaseBackupAuditDTO(
                "BACKUP",
                filename,
                fileSizeBytes,
                now,
                now.toString(),
                user.getFirstName() + " " + user.getLastName()
        );

        String details = "Backup by " + dto.backupPerformedBy();

        auditLogService.log(
                ActionType.BACKUP,
                ResourceType.DATABASE,
                null,
                details,
                jsonService.toJson(dto)
        );
    }

    public void logRestore(String filename, long fileSizeBytes,
                           String backupTimestamp, String backupPerformedBy) {
        User user = authenticatedUserService.getCurrentUser();

        DatabaseBackupAuditDTO dto = new DatabaseBackupAuditDTO(
                "RESTORE",
                filename,
                fileSizeBytes,
                Instant.now(),
                backupTimestamp,
                backupPerformedBy
        );

        String details = "Restored backup originally created by " + backupPerformedBy;

        auditLogService.log(
                ActionType.RESTORE,
                ResourceType.DATABASE,
                null,
                details,
                jsonService.toJson(dto)
        );
    }
}
