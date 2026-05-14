package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.backup.BackupRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.AuditLogRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.DatabaseBackupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.File;
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
                        var node = objectMapper.readTree(auditLog.getDetailsJson());
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
    public ResponseEntity<StreamingResponseBody> downloadBackup(
            @Valid @RequestBody BackupRequestDTO request) {

        File backupFile = databaseBackupService.generateBackup(request.currentPassword());

        String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
        String downloadFilename = "backup_" + timestamp + ".dump";

        StreamingResponseBody stream = outputStream -> {
            try {
                Files.copy(backupFile.toPath(), outputStream);
                outputStream.flush();
            } finally {
                Files.deleteIfExists(backupFile.toPath());
            }
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + downloadFilename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(backupFile.length())
                .body(stream);
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
