package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.backup.BackupRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.DatabaseBackupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/database")
public class DatabaseBackupController {

    private final DatabaseBackupService databaseBackupService;

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
