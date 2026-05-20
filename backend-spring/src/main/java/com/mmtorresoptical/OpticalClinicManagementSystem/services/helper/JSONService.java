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

    private static final Map<String, String> ROLE_LABELS = Map.of(
            "ADMIN", "Administrator",
            "STAFF", "Staff"
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

            // ── CREATE / ARCHIVE / RESTORE User: remove internal IDs, format role / birthDate / gender ──
            if (("CREATE".equals(actionType) || "ARCHIVE".equals(actionType) || "RESTORE".equals(actionType))
                    && node.has("userId") && node.has("username")) {
                return sanitizeUserAuditJson(node);
            }

            // ── CREATE / ARCHIVE / RESTORE Patient: remove internal IDs, strip sensitive PII ──
            if (("CREATE".equals(actionType) || "ARCHIVE".equals(actionType) || "RESTORE".equals(actionType))
                    && node.has("patientId") && node.has("firstName")) {
                return sanitizePatientAuditJson(node);
            }

            // ── VOID Prescription: minimal fields only ──
            if ("VOID".equals(actionType)
                    && node.has("prescriptionId") && node.has("issueDate")
                    && (node.has("rightEye") || node.has("leftEye") || node.has("bothEyes"))) {
                return sanitizePrescriptionAuditJson(node, false);
            }

            // ── CREATE / ARCHIVE / RESTORE Prescription: include rxNumber + eye groups, hide UUIDs ──
            if (("CREATE".equals(actionType) || "ARCHIVE".equals(actionType) || "RESTORE".equals(actionType))
                    && node.has("prescriptionId") && node.has("issueDate")
                    && (node.has("rightEye") || node.has("leftEye") || node.has("bothEyes"))) {
                return sanitizePrescriptionAuditJson(node, true);
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

    private String sanitizeUserAuditJson(ObjectNode node) throws JsonProcessingException {
        ObjectNode clean = objectMapper.createObjectNode();

        String rawRole = node.has("role") && !node.get("role").isNull()
                ? node.get("role").asText() : "";

        copyFullName(clean, node);
        clean.put("role", formatRole(rawRole));
        copyField(clean, node, "username");
        copyField(clean, node, "email");
        copyField(clean, node, "contactNumber");
        copyField(clean, node, "gender");
        copyField(clean, node, "birthDate");

        formatDisplayFields(clean);

        return objectMapper.writeValueAsString(clean);
    }

    private String sanitizePatientAuditJson(ObjectNode node) throws JsonProcessingException {
        ObjectNode clean = objectMapper.createObjectNode();

        copyFullName(clean, node);
        copyField(clean, node, "email");
        copyField(clean, node, "contactNumber");
        copyField(clean, node, "gender");
        copyField(clean, node, "createdAt");

        formatDisplayFields(clean);

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

        formatDisplayFields(filteredBefore);
        formatDisplayFields(filteredAfter);

        ObjectNode result = objectMapper.createObjectNode();
        result.set("before", filteredBefore);
        result.set("after", filteredAfter);
        return objectMapper.writeValueAsString(result);
    }

    private void formatDisplayFields(ObjectNode node) {
        var it = node.fieldNames();
        while (it.hasNext()) {
            String field = it.next();
            if ("birthDate".equals(field)) {
                String raw = node.get(field).asText();
                node.put(field, formatBirthDate(raw));
            } else if ("gender".equals(field)) {
                String raw = node.get(field).asText();
                node.put(field, capitalizeWord(raw));
            }
        }
    }

    private String formatBirthDate(String raw) {
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(raw);
            return date.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy"));
        } catch (Exception e) {
            return raw;
        }
    }

    private String capitalizeWord(String raw) {
        if (raw == null || raw.isEmpty()) return raw;
        return raw.substring(0, 1).toUpperCase() + raw.substring(1).toLowerCase();
    }

    private void copyFullName(ObjectNode target, ObjectNode source) {
        String first = source.has("firstName") && !source.get("firstName").isNull()
                ? source.get("firstName").asText() : "";
        String middle = source.has("middleName") && !source.get("middleName").isNull()
                ? source.get("middleName").asText() : "";
        String last = source.has("lastName") && !source.get("lastName").isNull()
                ? source.get("lastName").asText() : "";

        String fullName = first;
        if (!middle.isBlank()) {
            fullName += " " + middle;
        }
        if (!last.isBlank()) {
            fullName += " " + last;
        }
        target.put("fullName", fullName.trim());
    }

    private String sanitizePrescriptionAuditJson(ObjectNode node, boolean includeRxNumber) throws JsonProcessingException {
        ObjectNode clean = objectMapper.createObjectNode();

        if (includeRxNumber && node.has("rxNumber") && !node.get("rxNumber").isNull()) {
            clean.put("rxNumber", node.get("rxNumber").asText());
        }
        if (node.has("issueDate") && !node.get("issueDate").isNull()) {
            clean.put("issueDate", formatBirthDate(node.get("issueDate").asText()));
        }
        if (node.has("createdAt") && !node.get("createdAt").isNull()) {
            clean.put("createdAt", formatCreatedAt(node.get("createdAt").asText()));
        }
        if (node.has("notes")) {
            clean.put("notes", dashIfBlank(node.get("notes").asText(), "Notes"));
        }

        sanitizeEyeGroup(clean, node, "rightEye");
        sanitizeEyeGroup(clean, node, "leftEye");
        sanitizeEyeGroup(clean, node, "bothEyes");

        return objectMapper.writeValueAsString(clean);
    }

    private void sanitizeEyeGroup(ObjectNode target, ObjectNode source, String groupKey) {
        if (source.has(groupKey) && source.get(groupKey).isArray()) {
            var items = source.get(groupKey);
            var cleanItems = objectMapper.createArrayNode();
            for (var item : items) {
                if (item.isObject()) {
                    cleanItems.add(sanitizePrescriptionItemJson((ObjectNode) item));
                }
            }
            if (cleanItems.size() > 0) {
                target.set(groupKey, cleanItems);
            }
        }
    }

    private ObjectNode sanitizePrescriptionItemJson(ObjectNode node) {
        ObjectNode clean = objectMapper.createObjectNode();

        copyField(clean, node, "correctionType");
        copyField(clean, node, "sph");
        copyField(clean, node, "cyl");
        copyField(clean, node, "axis");
        copyField(clean, node, "addPower");
        copyField(clean, node, "pd");
        copyField(clean, node, "baseCurve");
        copyField(clean, node, "diameter");
        copyField(clean, node, "lensWearType");
        copyField(clean, node, "frameTypePreference");

        if (clean.has("correctionType")) {
            clean.put("correctionType", capitalizeWord(clean.get("correctionType").asText()));
        }

        if (node.has("eyeSide") && !node.get("eyeSide").isNull()) {
            clean.put("eyeSide", formatEyeSide(node.get("eyeSide").asText()));
        }

        String lensCustomizations = buildLensCustomizations(node);
        if (!lensCustomizations.isEmpty()) {
            clean.put("lensCustomizations", lensCustomizations);
        }

        if (node.has("followUpRequired") && node.get("followUpRequired").isBoolean()) {
            if (node.get("followUpRequired").asBoolean()) {
                String followUp = buildScheduledFollowUp(node);
                if (!followUp.isEmpty()) {
                    clean.put("scheduledFollowUp", followUp);
                }
            }
        }

        if (node.has("notes")) {
            clean.put("notes", dashIfBlank(node.get("notes").asText(), "Notes"));
        }

        return clean;
    }

    private String formatEyeSide(String raw) {
        return switch (raw.toUpperCase()) {
            case "LEFT" -> "Left Eye (OS)";
            case "RIGHT" -> "Right Eye (OD)";
            case "BOTH" -> "Both (OU)";
            default -> capitalizeWord(raw);
        };
    }

    private String buildLensCustomizations(ObjectNode node) {
        var parts = new java.util.ArrayList<String>();
        if (node.has("lensType") && !node.get("lensType").isNull()) {
            String val = node.get("lensType").asText();
            if (!val.isBlank()) parts.add(capitalizeWord(val));
        }
        if (node.has("lensMaterial") && !node.get("lensMaterial").isNull()) {
            String val = node.get("lensMaterial").asText();
            if (!val.isBlank()) parts.add(val);
        }
        if (node.has("lensCoatings") && !node.get("lensCoatings").isNull()) {
            String val = node.get("lensCoatings").asText();
            if (!val.isBlank()) parts.add(val);
        }
        if (node.has("lensMaterialCl") && !node.get("lensMaterialCl").isNull()) {
            String val = node.get("lensMaterialCl").asText();
            if (!val.isBlank()) parts.add("CL: " + val);
        }
        return String.join(", ", parts);
    }

    private String buildScheduledFollowUp(ObjectNode node) {
        var parts = new java.util.ArrayList<String>();
        if (node.has("followUpDate") && !node.get("followUpDate").isNull()) {
            parts.add(formatBirthDate(node.get("followUpDate").asText()));
        }
        if (node.has("followUpReason") && !node.get("followUpReason").isNull()) {
            String val = node.get("followUpReason").asText();
            if (!val.isBlank()) parts.add(val);
        }
        if (node.has("followUpStatus") && !node.get("followUpStatus").isNull()) {
            String val = node.get("followUpStatus").asText();
            if (!val.isBlank()) parts.add(capitalizeWord(val));
        }
        return String.join(" — ", parts);
    }

    private String formatCreatedAt(String raw) {
        try {
            java.time.LocalDateTime dateTime = java.time.LocalDateTime.parse(raw);
            return dateTime.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy, hh:mm a"));
        } catch (Exception e) {
            return raw;
        }
    }

    private String dashIfBlank(String value, String placeholder) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase(placeholder)) {
            return "—";
        }
        return value;
    }

    private String formatTransactionStatus(String status) {
        return TRANSACTION_STATUS_LABELS.getOrDefault(status, status);
    }

    private String formatRole(String role) {
        return ROLE_LABELS.getOrDefault(role, capitalizeWord(role));
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}