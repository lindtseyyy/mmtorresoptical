package com.mmtorresoptical.OpticalClinicManagementSystem.services.helper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

@Component
public class JSONService {

    private final ObjectMapper objectMapper;

    public JSONService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String toJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(
                    "Failed to serialize audit log JSON", e);
        }
    }

    public String sanitizeAuditDetailsJson(String detailsJson) {
        if (detailsJson == null || detailsJson.isBlank()) {
            return detailsJson;
        }

        try {
            ObjectNode node = (ObjectNode) objectMapper.readTree(detailsJson);

            if (node.has("fileSizeBytes") && node.get("fileSizeBytes").isNumber()) {
                long bytes = node.get("fileSizeBytes").asLong();
                node.put("fileSize", formatFileSize(bytes));
                node.remove("fileSizeBytes");
            }

            if (node.has("backupTimestamp") && node.has("timestamp")) {
                String backupTs = node.get("backupTimestamp").asText();
                String ts = node.get("timestamp").asText();
                if (backupTs.equals(ts)) {
                    node.remove("backupTimestamp");
                }
            }

            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            return detailsJson;
        }
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}