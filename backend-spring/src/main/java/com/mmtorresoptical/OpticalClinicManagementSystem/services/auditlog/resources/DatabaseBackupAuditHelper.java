package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.backup.DatabaseBackupAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Role;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class DatabaseBackupAuditHelper {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBackupAuditHelper.class);

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final AuthenticatedUserService authenticatedUserService;
    private final UserRepository userRepository;

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

    public void logSystemBackup(String filename, long fileSizeBytes, String performedBy) {
        Instant now = Instant.now();

        DatabaseBackupAuditDTO dto = new DatabaseBackupAuditDTO(
                "BACKUP",
                filename,
                fileSizeBytes,
                now,
                now.toString(),
                performedBy
        );

        String details;
        if ("SYSTEM".equals(performedBy)) {
            details = "Daily backup at 5:00 PM";
        } else {
            String timeStr = now.atZone(ZoneId.of("Asia/Manila"))
                    .format(DateTimeFormatter.ofPattern("h:mm a"));
            details = "Backup at " + timeStr;
        }

        User systemUser = userRepository.findFirstByRoleAndIsArchivedFalse(Role.ADMIN).orElse(null);
        if (systemUser == null) {
            Page<User> activeUsers = userRepository.findAllByIsArchivedFalse(PageRequest.of(0, 1));
            systemUser = activeUsers.hasContent() ? activeUsers.getContent().get(0) : null;
        }
        if (systemUser == null) {
            log.warn("Cannot create audit log for system backup '{}': no active users found in database", filename);
            return;
        }

        auditLogService.logForUser(
                ActionType.BACKUP,
                ResourceType.DATABASE,
                null,
                details,
                jsonService.toJson(dto),
                systemUser
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
