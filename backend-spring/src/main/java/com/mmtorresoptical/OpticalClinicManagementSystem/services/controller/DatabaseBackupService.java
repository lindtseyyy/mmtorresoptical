package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ConflictException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.DatabaseBackupAuditHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
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

    private final ReentrantLock restoreLock = new ReentrantLock();

    private static final byte[] PGDUMP_MAGIC = {'P', 'G', 'D', 'M', 'P'};
    private static final long MAX_BACKUP_FILE_SIZE = 2L * 1024 * 1024 * 1024; // 2 GB
    private static final long PROCESS_TIMEOUT_MINUTES = 30;

    public DatabaseBackupService(
            PasswordEncoder passwordEncoder,
            AuthenticatedUserService authenticatedUserService,
            DatabaseBackupAuditHelper databaseBackupAuditHelper,
            @Value("${spring.datasource.url}") String datasourceUrl,
            @Value("${spring.datasource.username}") String datasourceUsername,
            @Value("${spring.datasource.password}") String datasourcePassword,
            @Value("${app.database.backup.use-docker:false}") boolean useDocker,
            @Value("${app.database.backup.docker-container:postgres-db}") String dockerContainer) {
        this.passwordEncoder = passwordEncoder;
        this.authenticatedUserService = authenticatedUserService;
        this.databaseBackupAuditHelper = databaseBackupAuditHelper;
        this.datasourceUsername = datasourceUsername;
        this.datasourcePassword = datasourcePassword;
        this.useDocker = useDocker;
        this.dockerContainer = dockerContainer;

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

    public void validatePassword(String currentPassword) {
        User user = authenticatedUserService.getCurrentUser();
        if (currentPassword == null || currentPassword.isBlank()
                || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Invalid current password");
        }
    }

    public File generateBackup(String currentPassword) {
        validatePassword(currentPassword);

        String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
        String filename = "backup_" + timestamp + ".dump";
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
            }
            pb.redirectErrorStream(true);

            process = pb.start();

            if (useDocker) {
                // Docker mode: pg_dump writes to stdout, we capture to file
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

            if (!finished) {
                process.destroyForcibly();
                tempFile.delete();
                throw new RuntimeException("Backup process timed out after " + PROCESS_TIMEOUT_MINUTES + " minutes");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errorOutput;
                if (useDocker) {
                    errorOutput = "(check container logs for details)";
                } else {
                    errorOutput = new String(process.getInputStream().readAllBytes());
                }
                tempFile.delete();
                log.error("pg_dump failed with exit code {}: {}", exitCode, errorOutput);
                throw new RuntimeException("Database backup failed: exit code " + exitCode + " - " + errorOutput);
            }

            long fileSize = tempFile.length();
            databaseBackupAuditHelper.logBackup(filename, fileSize);

            return tempFile;

        } catch (IOException e) {
            tempFile.delete();
            throw new RuntimeException(wrapProcessError(e, "pg_dump"), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            tempFile.delete();
            throw new RuntimeException("Backup process was interrupted", e);
        }
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
            executePgRestore(uploadedFile);

            long fileSize = file.getSize();
            databaseBackupAuditHelper.logRestore(file.getOriginalFilename(), fileSize);

        } catch (IOException e) {
            throw new RuntimeException("Failed to process backup file for restore", e);
        } finally {
            cleanupTempFile(uploadedFile);
            cleanupTempFile(safetyBackupFile);
            restoreLock.unlock();
        }
    }

    private void validateBackupFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Backup file is empty");
        }

        if (file.getSize() > MAX_BACKUP_FILE_SIZE) {
            throw new BadRequestException("Backup file exceeds maximum allowed size of 2 GB");
        }

        byte[] magic = new byte[5];
        try (InputStream is = file.getInputStream()) {
            int bytesRead = is.read(magic);
            if (bytesRead < 5) {
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

    private File createSafetyBackup() {
        String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
        String filename = "pre_restore_" + timestamp + ".dump";

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
            }
            pb.redirectErrorStream(true);

            process = pb.start();

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

            if (!finished) {
                process.destroyForcibly();
                tempFile.delete();
                throw new RuntimeException("Safety backup timed out");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                tempFile.delete();
                String errorOutput = useDocker
                        ? "exit code " + exitCode + " (check container logs)"
                        : new String(process.getInputStream().readAllBytes());
                log.error("Safety backup pg_dump failed: {}", errorOutput);
                throw new RuntimeException("Failed to create safety backup before restore: " + errorOutput);
            }

            log.info("Safety backup created: {} ({} bytes)", filename, tempFile.length());
            return tempFile;

        } catch (IOException e) {
            tempFile.delete();
            throw new RuntimeException(wrapProcessError(e, "pg_dump"), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            tempFile.delete();
            throw new RuntimeException("Safety backup was interrupted", e);
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
            }
            pb.redirectErrorStream(true);

            process = pb.start();

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

            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("Restore process timed out after " + PROCESS_TIMEOUT_MINUTES + " minutes. A safety backup was created before the restore attempt.");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0 && exitCode != 1) {
                String errorOutput = useDocker
                        ? "exit code " + exitCode + " (check container logs)"
                        : new String(process.getInputStream().readAllBytes());
                log.error("pg_restore failed with exit code {}: {}", exitCode, errorOutput);
                throw new RuntimeException("Database restore failed: " + errorOutput);
            }

            if (exitCode == 1 && !useDocker) {
                String output = new String(process.getInputStream().readAllBytes());
                log.warn("pg_restore completed with warnings: {}", output);
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
        cmd.add(dockerContainer);
        cmd.add("pg_dump");
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
        cmd.add(dockerContainer);
        cmd.add("pg_restore");
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
