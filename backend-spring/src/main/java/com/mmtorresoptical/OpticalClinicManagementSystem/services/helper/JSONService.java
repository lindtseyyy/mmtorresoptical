package com.mmtorresoptical.OpticalClinicManagementSystem.services.helper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class JSONService {

    private final ObjectMapper objectMapper;

    private static final Map<String, String> TRANSACTION_STATUS_LABELS = Map.of(
            "DEPOSIT", "Partial Deposit Owed",
            "PAID", "Paid",
            "COMPLETED", "Completed",
            "VOIDED", "Voided",
            "REFUNDED", "Refunded"
    );

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

    public String sanitizeAuditDetailsJson(String detailsJson, String actionType, String performedBy) {
        if (detailsJson == null || detailsJson.isBlank()) {
            return detailsJson;
        }

        try {
            ObjectNode node = (ObjectNode) objectMapper.readTree(detailsJson);

            // ── Backup: raw bytes → human-readable ──
            if (node.has("fileSizeBytes") && node.get("fileSizeBytes").isNumber()) {
                long bytes = node.get("fileSizeBytes").asLong();
                node.put("fileSize", formatFileSize(bytes));
                node.remove("fileSizeBytes");
            }

            // ── Backup: suppress duplicate timestamp ──
            if (node.has("backupTimestamp") && node.has("timestamp")) {
                String backupTs = node.get("backupTimestamp").asText();
                String ts = node.get("timestamp").asText();
                if (backupTs.equals(ts)) {
                    node.remove("backupTimestamp");
                }
            }

            // ── Refund: collapse before/after pairs into human-readable rows ──
            if (node.has("refundReceiptNumber")
                    && node.has("beforeTotalAmount")
                    && node.has("afterTotalAmount")) {
                return sanitizeRefundAuditJson(node);
            }

            // ── CREATE Transaction: hide UUIDs, humanize statuses ──
            if ("CREATE".equals(actionType) && node.has("transactionItemAuditDTOList")) {
                return sanitizeCreateTransactionAuditJson(node, performedBy);
            }

            // ── CREATE / ARCHIVE Patient: remove internal IDs, strip sensitive PII ──
            if (("CREATE".equals(actionType) || "ARCHIVE".equals(actionType))
                    && node.has("patientId") && node.has("firstName")) {
                return sanitizePatientAuditJson(node);
            }

            // ── UPDATE Patient: only return fields that actually changed ──
            if ("UPDATE".equals(actionType) && node.has("before") && node.has("after")) {
                ObjectNode after = (ObjectNode) node.get("after");
                if (after.has("firstName")) {
                    return sanitizeUpdatePatientAuditJson(node);
                }
            }

            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            return detailsJson;
        }
    }

    private String sanitizeRefundAuditJson(ObjectNode node) throws JsonProcessingException {
        ObjectNode clean = objectMapper.createObjectNode();

        String[] keep = {
            "transactionNumber", "refundReceiptNumber", "products",
            "itemCount", "refundMethod", "cashReturnedToPatient"
        };
        for (String field : keep) {
            if (node.has(field)) {
                clean.set(field, node.get(field));
            }
        }

        if (node.has("beforeTotalAmount") && node.has("afterTotalAmount")) {
            String before = formatPeso(node.get("beforeTotalAmount").asDouble());
            String after = formatPeso(node.get("afterTotalAmount").asDouble());
            clean.put("orderTotal", "Changed from " + before + " to " + after);
        }

        if (node.has("beforeTransactionStatus") && node.has("afterTransactionStatus")) {
            String before = node.get("beforeTransactionStatus").asText();
            String after = node.get("afterTransactionStatus").asText();
            clean.put("transactionStatus", "Updated from " + before + " to " + after);
        }

        if (node.has("beforeRefundStatus") && node.has("afterRefundStatus")) {
            String before = node.get("beforeRefundStatus").asText();
            String after = node.get("afterRefundStatus").asText();
            clean.put("refundStatus", "Updated from " + before + " to " + after);
        }

        if (node.has("totalRefundValue")) {
            clean.set("valueOfReturnedItems", node.get("totalRefundValue"));
        }

        return objectMapper.writeValueAsString(clean);
    }

    private String formatPeso(double amount) {
        return String.format("₱%.2f", amount);
    }

    private String sanitizeCreateTransactionAuditJson(ObjectNode node, String performedBy) throws JsonProcessingException {
        node.remove("transactionId");
        node.remove("createdByUserId");

        if (performedBy != null && !performedBy.isBlank()) {
            node.put("createdBy", performedBy);
        }

        if (node.has("transactionStatus")) {
            String raw = node.get("transactionStatus").asText();
            node.put("transactionStatus", formatTransactionStatus(raw));
        }

        if (node.has("refundStatus")) {
            String refundStatus = node.get("refundStatus").asText();
            if ("NONE".equalsIgnoreCase(refundStatus)) {
                node.remove("refundStatus");
            }
        }

        return objectMapper.writeValueAsString(node);
    }

    private String sanitizePatientAuditJson(ObjectNode node) throws JsonProcessingException {
        ObjectNode clean = objectMapper.createObjectNode();

        copyField(clean, node, "firstName");
        copyMiddleName(clean, node);
        copyField(clean, node, "lastName");
        copyField(clean, node, "email");
        copyField(clean, node, "contactNumber");
        copyField(clean, node, "gender");
        copyField(clean, node, "createdAt");

        return objectMapper.writeValueAsString(clean);
    }

    private void copyField(ObjectNode target, ObjectNode source, String field) {
        if (source.has(field) && !source.get(field).isNull()) {
            target.set(field, source.get(field));
        }
    }

    private String sanitizeUpdatePatientAuditJson(ObjectNode node) throws JsonProcessingException {
        ObjectNode before = (ObjectNode) node.get("before");
        ObjectNode after = (ObjectNode) node.get("after");

        ObjectNode filteredBefore = objectMapper.createObjectNode();
        ObjectNode filteredAfter = objectMapper.createObjectNode();

        var it = after.fieldNames();
        while (it.hasNext()) {
            String field = it.next();
            String beforeVal = before.has(field) ? before.get(field).toString() : "";
            String afterVal = after.get(field).toString();
            if (!beforeVal.equals(afterVal)) {
                filteredBefore.set(field, before.get(field));
                filteredAfter.set(field, after.get(field));
            }
        }

        ObjectNode result = objectMapper.createObjectNode();
        result.set("before", filteredBefore);
        result.set("after", filteredAfter);
        return objectMapper.writeValueAsString(result);
    }

    private void copyMiddleName(ObjectNode target, ObjectNode source) {
        if (source.has("middleName") && !source.get("middleName").isNull()) {
            String value = source.get("middleName").asText();
            target.put("middleName", value.isBlank() ? "—" : value);
        } else {
            target.put("middleName", "—");
        }
    }

    private String formatTransactionStatus(String status) {
        return TRANSACTION_STATUS_LABELS.getOrDefault(status, status);
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}