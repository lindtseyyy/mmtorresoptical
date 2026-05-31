package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.backup.BackupRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.AuditLogRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.AesEncryptionService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.DatabaseBackupService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/database")
public class DatabaseBackupController {

    private final DatabaseBackupService databaseBackupService;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final AesEncryptionService aesEncryptionService;

    private static final String ENC_PREFIX = "ENC:";

    @GetMapping("/last-backup")
    public ResponseEntity<Map<String, String>> getLastBackup() {
        return auditLogRepository
                .findTopByActionTypeAndResourceTypeOrderByLoggedAtDesc(ActionType.BACKUP, ResourceType.DATABASE)
                .map(auditLog -> {
                    var user = auditLog.getUser();
                    String performedBy = user.getFirstName() + " " + user.getLastName();
                    return ResponseEntity.ok(Map.of(
                            "timestamp", auditLog.getLoggedAt().toString(),
                            "details", auditLog.getDetails(),
                            "performedBy", performedBy
                    ));
                })
                .orElseGet(() -> ResponseEntity.ok(Map.of(
                        "timestamp", "",
                        "details", "",
                        "performedBy", ""
                )));
    }

    @GetMapping("/last-restore")
    public ResponseEntity<Map<String, String>> getLastRestore() {
        return auditLogRepository
                .findTopByActionTypeAndResourceTypeOrderByLoggedAtDesc(ActionType.RESTORE, ResourceType.DATABASE)
                .map(auditLog -> {
                    var user = auditLog.getUser();
                    String performedBy = user.getFirstName() + " " + user.getLastName();

                    String backupTs = "";
                    String backupBy = "";
                    try {
                        String json = auditLog.getDetailsJson();
                        if (json != null && json.startsWith(ENC_PREFIX)) {
                            json = aesEncryptionService.decrypt(json.substring(ENC_PREFIX.length()));
                        }
                        var node = objectMapper.readTree(json);
                        if (node.has("backupTimestamp")) {
                            backupTs = node.get("backupTimestamp").asText();
                        }
                        if (node.has("backupPerformedBy")) {
                            backupBy = node.get("backupPerformedBy").asText();
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse restore audit detailsJson: {}", e.getMessage());
                    }

                    return ResponseEntity.ok(Map.of(
                            "timestamp", auditLog.getLoggedAt().toString(),
                            "details", auditLog.getDetails(),
                            "performedBy", performedBy,
                            "backupTimestamp", backupTs,
                            "backupPerformedBy", backupBy
                    ));
                })
                .orElseGet(() -> ResponseEntity.ok(Map.of(
                        "timestamp", "",
                        "details", "",
                        "performedBy", "",
                        "backupTimestamp", "",
                        "backupPerformedBy", ""
                )));
    }

    @PostMapping("/backup")
    public void downloadBackup(
            @Valid @RequestBody BackupRequestDTO request,
            HttpServletResponse response) throws Exception {

        File backupFile = databaseBackupService.generateBackup(request.currentPassword());

        String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
        String downloadFilename = "backup_" + timestamp + ".dump";

        response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setHeader("Content-Disposition", "attachment; filename=\"" + downloadFilename + "\"");
        response.setContentLengthLong(backupFile.length());

        try (FileInputStream fis = new FileInputStream(backupFile);
             OutputStream os = response.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            os.flush();
        } finally {
            Files.deleteIfExists(backupFile.toPath());
        }
    }

    @PostMapping(value = "/restore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> restoreBackup(
            @RequestParam("file") MultipartFile file,
            @RequestParam("currentPassword") String currentPassword) {

        databaseBackupService.restoreBackup(file, currentPassword);

        return ResponseEntity.ok(Map.of(
                "message", "Database restored successfully. A safety backup was created before the restore operation."
        ));
    }
}
