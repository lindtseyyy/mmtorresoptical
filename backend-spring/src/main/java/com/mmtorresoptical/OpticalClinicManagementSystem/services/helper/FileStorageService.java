package com.mmtorresoptical.OpticalClinicManagementSystem.services.helper;

import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path uploadDir;

    public FileStorageService(@Value("${app.upload.product-images-dir:uploads/products}") String uploadPath) {
        this.uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadDir);
            log.info("Product image upload directory initialized: {}", uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + uploadDir, e);
        }
    }

    /**
     * Stores a multipart file to disk with a UUID-prefixed sanitized filename.
     *
     * @param file the uploaded file
     * @return the generated unique filename (not the full path)
     */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Sanitize: keep only alphanumeric, dash, underscore; lowercase
        String baseName = "image";
        if (originalFilename != null) {
            String nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
            nameWithoutExt = nameWithoutExt.replaceAll("[^a-zA-Z0-9_-]", "_").toLowerCase();
            if (nameWithoutExt.length() > 50) {
                nameWithoutExt = nameWithoutExt.substring(0, 50);
            }
            if (!nameWithoutExt.isBlank()) {
                baseName = nameWithoutExt;
            }
        }

        String prefix = UUID.randomUUID().toString().substring(0, 8);
        String uniqueFilename = "prod_" + prefix + "_" + baseName + extension;

        try {
            Path targetPath = uploadDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored product image: {}", uniqueFilename);
            return uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + uniqueFilename, e);
        }
    }

    /**
     * Resolves a filename to an absolute Path on disk.
     */
    public Path load(String filename) {
        return uploadDir.resolve(filename).normalize();
    }

    /**
     * Loads a filename as a Spring Resource for streaming.
     * Falls back to classpath for the default product logo.
     */
    public Resource loadAsResource(String filename) {
        Path filePath = load(filename);

        if (!filePath.startsWith(uploadDir)) {
            throw new ResourceNotFoundException("Invalid file path: " + filename);
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
        } catch (IOException ignored) {
        }

        // Fallback: serve default image from classpath
        if ("default_product_logo.png".equals(filename)) {
            Resource classpathResource = new org.springframework.core.io.ClassPathResource("static/default_product_logo.png");
            if (classpathResource.exists()) {
                return classpathResource;
            }
        }

        throw new ResourceNotFoundException("File not found: " + filename);
    }

    /**
     * Determines the MediaType from the file extension.
     */
    public MediaType getContentType(String filename) {
        if (filename == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }

        String lower = filename.toLowerCase();

        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        if (lower.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (lower.endsWith(".webp")) return MediaType.valueOf("image/webp");
        if (lower.endsWith(".svg")) return MediaType.valueOf("image/svg+xml");

        return MediaType.APPLICATION_OCTET_STREAM;
    }

    /**
     * Deletes a product image file from disk. Caller should handle the DB side.
     */
    public void delete(String filename) {
        if (filename == null || filename.isBlank()) return;
        try {
            Path filePath = load(filename);
            if (filePath.startsWith(uploadDir)) {
                Files.deleteIfExists(filePath);
                log.info("Deleted product image: {}", filename);
            }
        } catch (IOException e) {
            log.warn("Failed to delete product image: {}", filename, e);
        }
    }
}
