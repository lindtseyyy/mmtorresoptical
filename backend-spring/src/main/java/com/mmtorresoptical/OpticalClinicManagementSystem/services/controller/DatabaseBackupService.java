package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ConflictException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.DatabaseBackupAuditHelper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
public class DatabaseBackupService {

    private final PasswordEncoder passwordEncoder;
    private final AuthenticatedUserService authenticatedUserService;
    private final DatabaseBackupAuditHelper databaseBackupAuditHelper;

    private final String datasourceUsername;
    private final String datasourcePassword;
    private final String dbHost;
    private final String dbPort;
    private final String dbName;
    private final boolean useDocker;
    private final String dockerContainer;
    private final Path backupBaseDir;

    private final ReentrantLock restoreLock = new ReentrantLock();

    private static final byte[] PGDUMP_MAGIC = {'P', 'G', 'D', 'M', 'P'};
    private static final long MAX_BACKUP_FILE_SIZE = 2L * 1024 * 1024 * 1024; // 2 GB
    private static final long PROCESS_TIMEOUT_MINUTES = 30;

    private boolean isScheduledBackupExecuted = false;
    private LocalDate scheduledBackupDate = null;

    public DatabaseBackupService(
            PasswordEncoder passwordEncoder,
            AuthenticatedUserService authenticatedUserService,
            DatabaseBackupAuditHelper databaseBackupAuditHelper,
            @Value("${spring.datasource.url}") String datasourceUrl,
            @Value("${spring.datasource.username}") String datasourceUsername,
            @Value("${spring.datasource.password}") String datasourcePassword,
            @Value("${app.database.backup.use-docker:false}") boolean useDocker,
            @Value("${app.database.backup.docker-container:postgres-db}") String dockerContainer,
            @Value("${app.project.dir:}") String projectDir) {
        this.passwordEncoder = passwordEncoder;
        this.authenticatedUserService = authenticatedUserService;
        this.databaseBackupAuditHelper = databaseBackupAuditHelper;
        this.datasourceUsername = datasourceUsername;
        this.datasourcePassword = datasourcePassword;
        this.useDocker = useDocker;
        this.dockerContainer = dockerContainer;

        String baseDir = projectDir != null && !projectDir.isBlank()
                ? projectDir
                : System.getProperty("user.dir");
        this.backupBaseDir = Path.of(baseDir, "backups");

        // Parse jdbc:postgresql://host:port/dbname
        String url = datasourceUrl.replace("jdbc:postgresql://", "");
        int slashIdx = url.indexOf('/');
        if (slashIdx < 0) {
            throw new IllegalStateException("Invalid datasource URL: expected jdbc:postgresql://host:port/dbname but got: " + datasourceUrl);
        }
        String hostPort = url.substring(0, slashIdx);
        this.dbName = url.substring(slashIdx + 1);

        int colonIdx = hostPort.indexOf(':');
        if (colonIdx > 0) {
            this.dbHost = hostPort.substring(0, colonIdx);
            this.dbPort = hostPort.substring(colonIdx + 1);
        } else {
            this.dbHost = hostPort;
            this.dbPort = "5432";
        }
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(backupBaseDir);
            log.info("Backup base directory initialized: {}", backupBaseDir.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to create backup base directory: {}", backupBaseDir.toAbsolutePath(), e);
        }

        checkAndExecuteMissedBackup();
    }

    private void checkAndExecuteMissedBackup() {
        LocalTime now = LocalTime.now();
        LocalTime scheduledTime = LocalTime.of(17, 0);
        
        if (!now.isBefore(scheduledTime)) {
            log.info("Startup: current time is {} (at/after 5:00 PM). Checking if backup is needed.", now);
            
            if (!isScheduledBackupExecuted || !LocalDate.now().equals(scheduledBackupDate)) {
                log.info("Startup: no backup executed today. Executing missed scheduled backup.");
                try {
                    String filename = executeDumpToBackupsFolder("SYSTEM-MISSED");
                    isScheduledBackupExecuted = true;
                    scheduledBackupDate = LocalDate.now();
                    log.info("Missed backup completed successfully.");
                    
                    File backupFile = resolveBackupFilePath(filename);
                    databaseBackupAuditHelper.logSystemBackup(filename, backupFile.length(), "SYSTEM-MISSED");
                } catch (Exception e) {
                    log.error("Startup: failed to execute missed backup", e);
                }
            } else {
                log.info("Startup: backup already executed today. Skipping.");
            }
        }
    }

    // ---- Automated triggers ----

    @Scheduled(cron = "0 0 17 * * MON-SAT")
    public void scheduledBackup() {
        log.info("Scheduled backup triggered at {}", Instant.now());
        String filename = null;
        try {
            filename = executeDumpToBackupsFolder("SYSTEM");
            isScheduledBackupExecuted = true;
            scheduledBackupDate = LocalDate.now();
            log.info("Scheduled backup completed successfully. Flag set.");
        } catch (Exception e) {
            log.error("Scheduled backup failed", e);
        }

        if (filename != null) {
            try {
                File backupFile = resolveBackupFilePath(filename);
                databaseBackupAuditHelper.logSystemBackup(filename, backupFile.length(), "SYSTEM");
            } catch (Exception e) {
                log.error("Failed to log scheduled backup audit", e);
            }
        }
    }

    @PreDestroy
    public void onShutdown() {
        LocalDate today = LocalDate.now();

        if (isScheduledBackupExecuted && today.equals(scheduledBackupDate)) {
            log.info("Shutdown: scheduled backup already executed today, skipping.");
            return;
        }

        LocalTime now = LocalTime.now();
        if (now.isBefore(LocalTime.of(17, 0))) {
            log.info("Shutdown: before 5:00 PM ({}), executing emergency safety backup.", now);
            String filename = null;
            try {
                filename = executeDumpToBackupsFolder("SYSTEM-EMERGENCY");
            } catch (Exception e) {
                log.error("Emergency shutdown backup failed", e);
            }
            if (filename != null) {
                try {
                    File backupFile = resolveBackupFilePath(filename);
                    databaseBackupAuditHelper.logSystemBackup(filename, backupFile.length(), "SYSTEM-EMERGENCY");
                } catch (Exception e) {
                    log.error("Failed to log emergency backup audit", e);
                }
            }
        } else {
            log.info("Shutdown: at/after 5:00 PM but scheduled backup was not executed (laptop was offline/asleep). Executing backup now.");
            String filename = null;
            try {
                filename = executeDumpToBackupsFolder("SYSTEM-EMERGENCY");
            } catch (Exception e) {
                log.error("Post-5PM shutdown backup failed", e);
            }
            if (filename != null) {
                try {
                    File backupFile = resolveBackupFilePath(filename);
                    databaseBackupAuditHelper.logSystemBackup(filename, backupFile.length(), "SYSTEM-EMERGENCY");
                } catch (Exception e) {
                    log.error("Failed to log post-5PM backup audit", e);
                }
            }
        }
    }

    // ---- Manual backup (called from controller) ----

    public File generateBackup(String currentPassword) {
        validatePassword(currentPassword);

        User user = authenticatedUserService.getCurrentUser();
        String filename = executeDumpToBackupsFolder(user.getFirstName() + " " + user.getLastName());
        File backupFile = resolveBackupFilePath(filename);
        databaseBackupAuditHelper.logBackup(filename, backupFile.length());
        return backupFile;
    }

    public void restoreBackup(MultipartFile file, String currentPassword) {
        validatePassword(currentPassword);
        validateBackupFile(file);

        if (!restoreLock.tryLock()) {
            throw new ConflictException("A restore operation is already in progress. Please wait for it to complete.");
        }

        File uploadedFile = null;
        File safetyBackupFile = null;

        try {
            safetyBackupFile = createSafetyBackup();
            uploadedFile = writeUploadedFile(file);

            // Read embedded metadata from the uploaded file before stripping it
            String backupTimestamp = "";
            String backupPerformedBy = "";
            try {
                byte[] content = Files.readAllBytes(uploadedFile.toPath());
                int newlinePos = -1;
                for (int i = 0; i < Math.min(content.length, 2048); i++) {
                    if (content[i] == '\n') {
                        newlinePos = i;
                        break;
                    }
                }
                if (newlinePos > 0 && content[0] == '{') {
                    String jsonLine = new String(content, 0, newlinePos, StandardCharsets.UTF_8);
                    log.info("Restore file metadata header: {}", jsonLine);
                    backupTimestamp = extractJsonString(jsonLine, "backupTimestamp");
                    backupPerformedBy = extractJsonString(jsonLine, "performedBy");
                    log.info("Extracted metadata — backupTimestamp: '{}', backupPerformedBy: '{}'",
                            backupTimestamp, backupPerformedBy);
                } else {
                    log.warn("No metadata header found in restore file. firstByte={}, newlinePos={}",
                            content.length > 0 ? (char) content[0] : "empty", newlinePos);
                }
            } catch (IOException e) {
                log.warn("Failed to read metadata from restore file", e);
            }

            uploadedFile = stripMetadataLine(uploadedFile);
            executePgRestore(uploadedFile);

            long fileSize = file.getSize();
            databaseBackupAuditHelper.logRestore(
                    file.getOriginalFilename(), fileSize, backupTimestamp, backupPerformedBy);

        } catch (IOException e) {
            throw new RuntimeException("Failed to process backup file for restore", e);
        } finally {
            cleanupTempFile(uploadedFile);
            cleanupTempFile(safetyBackupFile);
            restoreLock.unlock();
        }
    }

    // ---- Core dump execution ----

    private String executeDumpToBackupsFolder(String performedBy) {
        File tempFile;
        try {
            tempFile = File.createTempFile("pgdump_", ".dump");
        } catch (IOException e) {
            throw new RuntimeException("Failed to create temporary file for backup", e);
        }

        Process process = null;
        try {
            ProcessBuilder pb;
            if (useDocker) {
                pb = buildDockerPgDumpCommand();
            } else {
                pb = buildLocalPgDumpCommand(dbHost, dbPort, tempFile);
                pb.redirectErrorStream(true);
            }

            process = pb.start();
            final Process runningProcess = process;

            // Docker mode: capture stderr in background thread for error reporting
            StringBuilder stderrCapture = new StringBuilder();
            Thread stderrThread = null;
            if (useDocker) {
                stderrThread = new Thread(() -> {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(runningProcess.getErrorStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            stderrCapture.append(line).append("\n");
                        }
                    } catch (IOException ignored) {
                    }
                });
                stderrThread.setDaemon(true);
                stderrThread.start();
            }

            if (useDocker) {
                // Docker mode: pg_dump writes to stdout, we capture to file
                try (InputStream stdout = runningProcess.getInputStream();
                     FileOutputStream fos = new FileOutputStream(tempFile)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = stdout.read(buffer)) != -1) {
                        fos.write(buffer, 0, bytesRead);
                    }
                }
            }

            boolean finished = process.waitFor(PROCESS_TIMEOUT_MINUTES, TimeUnit.MINUTES);

            // Wait for stderr reader to finish
            if (stderrThread != null) {
                stderrThread.join(5000);
            }

            if (!finished) {
                process.destroyForcibly();
                tempFile.delete();
                throw new RuntimeException("Backup process timed out after " + PROCESS_TIMEOUT_MINUTES + " minutes");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errorOutput;
                if (useDocker) {
                    errorOutput = !stderrCapture.isEmpty()
                            ? stderrCapture.toString().trim()
                            : "(no error output captured from pg_dump)";
                } else {
                    errorOutput = new String(process.getInputStream().readAllBytes());
                }
                tempFile.delete();
                log.error("pg_dump failed with exit code {}: {}", exitCode, errorOutput);
                throw new RuntimeException("Database backup failed: " + errorOutput);
            }

            long fileSize = tempFile.length();
            String filename = buildBackupFilename();
            tempFile = prependMetadata(tempFile, performedBy);
            moveBackupToFolder(tempFile, filename);

            log.info("Backup saved to backups folder: {} ({} bytes)", filename, fileSize);
            return filename;

        } catch (IOException e) {
            tempFile.delete();
            throw new RuntimeException(wrapProcessError(e, "pg_dump"), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            tempFile.delete();
            throw new RuntimeException("Backup process was interrupted", e);
        }
    }

    private File createSafetyBackup() {
        File tempFile;
        try {
            tempFile = File.createTempFile("pre_restore_", ".dump");
        } catch (IOException e) {
            throw new RuntimeException("Failed to create temporary file for safety backup", e);
        }

        Process process = null;
        try {
            ProcessBuilder pb;
            if (useDocker) {
                pb = buildDockerPgDumpCommand();
            } else {
                pb = buildLocalPgDumpCommand(dbHost, dbPort, tempFile);
                pb.redirectErrorStream(true);
            }

            process = pb.start();

            // Docker mode: capture stderr in background thread for error reporting
            StringBuilder stderrCapture = new StringBuilder();
            Thread stderrThread = null;
            if (useDocker) {
                final Process runningProcess = process;
                stderrThread = new Thread(() -> {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(runningProcess.getErrorStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            stderrCapture.append(line).append("\n");
                        }
                    } catch (IOException ignored) {
                    }
                });
                stderrThread.setDaemon(true);
                stderrThread.start();
            }

            if (useDocker) {
                try (InputStream stdout = process.getInputStream();
                     FileOutputStream fos = new FileOutputStream(tempFile)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = stdout.read(buffer)) != -1) {
                        fos.write(buffer, 0, bytesRead);
                    }
                }
            }

            boolean finished = process.waitFor(PROCESS_TIMEOUT_MINUTES, TimeUnit.MINUTES);

            // Wait for stderr reader to finish
            if (stderrThread != null) {
                stderrThread.join(5000);
            }

            if (!finished) {
                process.destroyForcibly();
                tempFile.delete();
                throw new RuntimeException("Safety backup timed out");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                tempFile.delete();
                String errorOutput = useDocker
                        ? (!stderrCapture.isEmpty()
                            ? stderrCapture.toString().trim()
                            : "(no error output captured from pg_dump)")
                        : new String(process.getInputStream().readAllBytes());
                log.error("Safety backup pg_dump failed: {}", errorOutput);
                throw new RuntimeException("Failed to create safety backup before restore: " + errorOutput);
            }

            log.info("Safety backup created ({} bytes)", tempFile.length());
            return prependMetadata(tempFile);

        } catch (IOException e) {
            tempFile.delete();
            throw new RuntimeException(wrapProcessError(e, "pg_dump"), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            tempFile.delete();
            throw new RuntimeException("Safety backup was interrupted", e);
        }
    }

    // ---- Backup file path management ----

    private String buildBackupFilename() {
        return "backup_" + DateTimeFormatter.ofPattern("HH-mm-ss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now()) + ".dump";
    }

    private File resolveBackupFilePath(String filename) {
        return backupBaseDir.resolve(buildDateFolderName()).resolve(filename).toFile();
    }

    private String buildDateFolderName() {
        return DateTimeFormatter.ofPattern("MM-dd-yyyy")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
    }

    private void moveBackupToFolder(File sourceFile, String filename) {
        try {
            Path dateFolder = backupBaseDir.resolve(buildDateFolderName());
            Files.createDirectories(dateFolder);
            Path destination = dateFolder.resolve(filename);
            Files.move(sourceFile.toPath(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            cleanupTempFile(sourceFile);
            throw new RuntimeException("Failed to move backup to backups folder", e);
        }
    }

    // ---- Restore helpers ----

    private void validateBackupFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Backup file is empty");
        }

        if (file.getSize() > MAX_BACKUP_FILE_SIZE) {
            throw new BadRequestException("Backup file exceeds maximum allowed size of 2 GB");
        }

        byte[] magic = new byte[5];
        try (InputStream is = file.getInputStream()) {
            int firstByte = is.read();
            if (firstByte < 0) {
                throw new BadRequestException("Invalid backup file: file is too small to be a valid PostgreSQL backup");
            }

            // Skip metadata header line if present (new format: {json}\nPGDMP...)
            if (firstByte == '{') {
                int b;
                while ((b = is.read()) != -1 && b != '\n') {
                    // skip metadata line
                }
                if (b != '\n') {
                    throw new BadRequestException("Invalid backup file: metadata header is malformed");
                }
                firstByte = is.read(); // should now be 'P' from PGDMP
            }

            magic[0] = (byte) firstByte;
            int bytesRead = is.read(magic, 1, 4);
            if (bytesRead < 4) {
                throw new BadRequestException("Invalid backup file: file is too small to be a valid PostgreSQL backup");
            }
            for (int i = 0; i < 5; i++) {
                if (magic[i] != PGDUMP_MAGIC[i]) {
                    throw new BadRequestException("Invalid backup file: file does not appear to be a valid PostgreSQL custom-format dump. Only pg_dump -Fc custom-format backups are supported.");
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to validate backup file", e);
        }
    }

    private File writeUploadedFile(MultipartFile file) throws IOException {
        Path tempPath = Files.createTempFile("restore_", ".dump");
        File tempFile = tempPath.toFile();
        try (InputStream is = file.getInputStream();
             FileOutputStream fos = new FileOutputStream(tempFile)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
            }
        }
        return tempFile;
    }

    private void executePgRestore(File backupFile) {
        Process process = null;
        try {
            ProcessBuilder pb;
            if (useDocker) {
                pb = buildDockerPgRestoreCommand();
            } else {
                pb = buildLocalPgRestoreCommand(backupFile);
                pb.redirectErrorStream(true);
            }

            process = pb.start();

            // Docker mode: capture stderr in background thread for error reporting
            StringBuilder stderrCapture = new StringBuilder();
            Thread stderrThread = null;
            if (useDocker) {
                final Process runningProcess = process;
                stderrThread = new Thread(() -> {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(runningProcess.getErrorStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            stderrCapture.append(line).append("\n");
                        }
                    } catch (IOException ignored) {
                    }
                });
                stderrThread.setDaemon(true);
                stderrThread.start();
            }

            if (useDocker) {
                // Pipe the backup file to pg_restore stdin via docker exec -i
                try (OutputStream stdin = process.getOutputStream();
                     InputStream fileIn = Files.newInputStream(backupFile.toPath())) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = fileIn.read(buffer)) != -1) {
                        stdin.write(buffer, 0, bytesRead);
                    }
                    stdin.flush();
                }
            }

            boolean finished = process.waitFor(PROCESS_TIMEOUT_MINUTES, TimeUnit.MINUTES);

            // Wait for stderr reader to finish
            if (stderrThread != null) {
                stderrThread.join(5000);
            }

            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("Restore process timed out after " + PROCESS_TIMEOUT_MINUTES + " minutes. A safety backup was created before the restore attempt.");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0 && exitCode != 1) {
                String errorOutput = useDocker
                        ? (!stderrCapture.isEmpty()
                            ? stderrCapture.toString().trim()
                            : "exit code " + exitCode + " (no error output captured from pg_restore)")
                        : new String(process.getInputStream().readAllBytes());
                log.error("pg_restore failed with exit code {}: {}", exitCode, errorOutput);
                throw new RuntimeException("Database restore failed: " + errorOutput);
            }

            if (exitCode == 1) {
                String output = useDocker
                        ? (!stderrCapture.isEmpty() ? stderrCapture.toString().trim() : "")
                        : new String(process.getInputStream().readAllBytes());
                if (!output.isEmpty()) {
                    log.warn("pg_restore completed with warnings: {}", output);
                }
            }

            log.info("Database restore completed successfully from: {}", backupFile.getAbsolutePath());

        } catch (IOException e) {
            throw new RuntimeException(wrapProcessError(e, "pg_restore"), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Restore process was interrupted. A safety backup was created before the restore attempt.", e);
        }
    }

    // ---- Command builders ----

    private ProcessBuilder buildDockerPgDumpCommand() {
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("exec");
        cmd.add("-e");
        cmd.add("PGPASSWORD=" + datasourcePassword);
        cmd.add(dockerContainer);
        cmd.add("pg_dump");
        cmd.add("--no-password");
        cmd.add("-Fc");
        cmd.add("-U");
        cmd.add(datasourceUsername);
        cmd.add("-d");
        cmd.add(dbName);
        // No -h flag: uses Unix socket inside the container
        return new ProcessBuilder(cmd);
    }

    private ProcessBuilder buildLocalPgDumpCommand(String host, String port, File outputFile) {
        ProcessBuilder pb = new ProcessBuilder(
                "pg_dump",
                "-Fc",
                "--no-password",
                "-h", host,
                "-p", port,
                "-U", datasourceUsername,
                "-d", dbName,
                "-f", outputFile.getAbsolutePath()
        );
        pb.environment().put("PGPASSWORD", datasourcePassword);
        return pb;
    }

    private ProcessBuilder buildDockerPgRestoreCommand() {
        List<String> cmd = new ArrayList<>();
        cmd.add("docker");
        cmd.add("exec");
        cmd.add("-i"); // stream stdin into the container
        cmd.add("-e");
        cmd.add("PGPASSWORD=" + datasourcePassword);
        cmd.add(dockerContainer);
        cmd.add("pg_restore");
        cmd.add("--no-password");
        cmd.add("--clean");
        cmd.add("--if-exists");
        cmd.add("--no-owner");
        cmd.add("--no-privileges");
        cmd.add("-U");
        cmd.add(datasourceUsername);
        cmd.add("-d");
        cmd.add(dbName);
        // No -h flag: uses Unix socket inside the container
        return new ProcessBuilder(cmd);
    }

    private ProcessBuilder buildLocalPgRestoreCommand(File backupFile) {
        ProcessBuilder pb = new ProcessBuilder(
                "pg_restore",
                "--clean",
                "--if-exists",
                "--no-password",
                "--no-owner",
                "--no-privileges",
                "-h", dbHost,
                "-p", dbPort,
                "-U", datasourceUsername,
                "-d", dbName,
                backupFile.getAbsolutePath()
        );
        pb.environment().put("PGPASSWORD", datasourcePassword);
        return pb;
    }

    // ---- Metadata ----

    private void validatePassword(String currentPassword) {
        User user = authenticatedUserService.getCurrentUser();
        if (currentPassword == null || currentPassword.isBlank()
                || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Incorrect password. Please verify your password and try again.");
        }
    }

    private String extractJsonString(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start < 0) return "";
        start += search.length();
        int end = json.indexOf("\"", start);
        if (end < 0) return "";
        return json.substring(start, end);
    }

    private String buildMetadataJson() {
        User user = authenticatedUserService.getCurrentUser();
        return String.format(
                "{\"backupTimestamp\":\"%s\",\"performedBy\":\"%s %s\",\"databaseName\":\"%s\"}",
                Instant.now().toString(),
                user.getFirstName(),
                user.getLastName(),
                dbName
        );
    }

    private File prependMetadata(File dumpFile) throws IOException {
        return prependMetadata(dumpFile, null);
    }

    private File prependMetadata(File dumpFile, String performedBy) throws IOException {
        String metadata;
        if (performedBy != null) {
            metadata = String.format(
                    "{\"backupTimestamp\":\"%s\",\"performedBy\":\"%s\",\"databaseName\":\"%s\"}",
                    Instant.now().toString(), performedBy, dbName);
        } else {
            metadata = buildMetadataJson();
        }
        byte[] metadataBytes = (metadata + "\n").getBytes(StandardCharsets.UTF_8);

        File finalFile = File.createTempFile("pgdump_meta_", ".dump");
        try (OutputStream out = new FileOutputStream(finalFile);
             InputStream in = new FileInputStream(dumpFile)) {
            out.write(metadataBytes);
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        }
        dumpFile.delete();
        return finalFile;
    }

    private File stripMetadataLine(File source) throws IOException {
        byte[] content = Files.readAllBytes(source.toPath());
        int newlinePos = -1;
        for (int i = 0; i < Math.min(content.length, 2048); i++) {
            if (content[i] == '\n') {
                newlinePos = i;
                break;
            }
        }

        if (newlinePos <= 0 || newlinePos >= 1000 || content[0] != '{') {
            // No metadata header present, return the file as-is
            return source;
        }

        File cleanFile = File.createTempFile("restore_clean_", ".dump");
        try (OutputStream out = new FileOutputStream(cleanFile)) {
            out.write(content, newlinePos + 1, content.length - newlinePos - 1);
        }
        return cleanFile;
    }

    // ---- Helpers ----

    private String wrapProcessError(IOException e, String toolName) {
        String message = e.getMessage();
        if (message != null && (message.contains("No such file") || message.contains("Cannot run program"))) {
            if (toolName.equals("pg_dump") && useDocker) {
                return "Docker is not available or the container '" + dockerContainer
                        + "' is not running. Ensure Docker is installed and the container is running.";
            }
            return toolName + " is not installed or not found in PATH. "
                    + "Install PostgreSQL client tools, or set app.database.backup.use-docker=true "
                    + "if PostgreSQL is running in Docker.";
        }
        return "Failed to execute " + toolName + ": " + message;
    }

    private void cleanupTempFile(File file) {
        if (file != null && file.exists()) {
            try {
                Files.deleteIfExists(file.toPath());
            } catch (IOException e) {
                log.warn("Failed to clean up temporary file: {}", file.getAbsolutePath(), e);
            }
        }
    }
}
