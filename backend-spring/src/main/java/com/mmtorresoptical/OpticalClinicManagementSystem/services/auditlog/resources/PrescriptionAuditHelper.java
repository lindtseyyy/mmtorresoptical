package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescription.PrescriptionAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.LensSpecificationDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionLensDetailMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionLensDetail;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionRecommendation;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.basehelper.AuditLogHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionAuditHelper implements AuditLogHelper<Prescription> {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final PrescriptionMapper prescriptionMapper;
    private final PrescriptionLensDetailMapper prescriptionLensDetailMapper;
    private final ObjectMapper objectMapper;

    @Override
    public void logCreate(Prescription prescription) {
        String detailsJson = buildDetailsJson(prescription);
        String rxNumber = prescription.getRxNumber();
        auditLogService.log(ActionType.CREATE,
                ResourceType.PRESCRIPTION,
                prescription.getPrescriptionId(),
                rxNumber != null ? "Created prescription record: " + rxNumber : "Created prescription record",
                detailsJson
        );
    }

    @Override
    public void logUpdate(Prescription beforePrescription, Prescription afterPrescription) {
        PrescriptionAuditDTO before =
                prescriptionMapper.entityToAuditDTO(beforePrescription);
        PrescriptionAuditDTO after =
                prescriptionMapper.entityToAuditDTO(afterPrescription);
        AuditUpdateEvent<PrescriptionAuditDTO> event =
                new AuditUpdateEvent<>(before, after);
        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.PRESCRIPTION,
                after.getPrescriptionId(),
                "Updated prescription record",
                detailsJson
        );
    }

    @Override
    public void logArchive(Prescription prescription) {
        String detailsJson = buildDetailsJson(prescription);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.PRESCRIPTION,
                prescription.getPrescriptionId(),
                "Archived prescription record",
                detailsJson
        );
    }

    @Override
    public void logRestore(Prescription prescription) {
        String detailsJson = buildDetailsJson(prescription);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.PRESCRIPTION,
                prescription.getPrescriptionId(),
                "Restored prescription record",
                detailsJson
        );
    }

    public void logVoid(Prescription prescription) {
        String detailsJson = buildDetailsJson(prescription);
        String rxNumber = prescription.getRxNumber();
        auditLogService.log(ActionType.VOID,
                ResourceType.PRESCRIPTION,
                prescription.getPrescriptionId(),
                rxNumber != null ? "Voided prescription record: " + rxNumber : "Voided prescription record",
                detailsJson
        );
    }

    private String buildDetailsJson(Prescription prescription) {
        PrescriptionAuditDTO auditDTO = prescriptionMapper.entityToAuditDTO(prescription);
        ObjectNode root = objectMapper.valueToTree(auditDTO);

        List<PrescriptionLensDetail> lensDetails = prescription.getPrescriptionLensDetails();
        if (lensDetails != null && !lensDetails.isEmpty()) {
            ArrayNode specs = objectMapper.createArrayNode();

            for (PrescriptionLensDetail detail : lensDetails) {
                ObjectNode spec = objectMapper.createObjectNode();
                spec.put("correctionType", detail.getCorrectionType());
                putIfNotNull(spec, "lensTypePurpose", detail.getLensTypePurpose());

                // Right eye specs
                ObjectNode rightEye = objectMapper.createObjectNode();
                putIfNotNull(rightEye, "sph", detail.getRightSph());
                putIfNotNull(rightEye, "cyl", detail.getRightCyl());
                putIfNotNull(rightEye, "axis", detail.getRightAxis());
                putIfNotNull(rightEye, "addPower", detail.getRightAdd());
                putIfNotNull(rightEye, "pd", detail.getRightPd());
                if (rightEye.size() > 0) {
                    spec.set("rightEye", rightEye);
                }

                // Left eye specs
                ObjectNode leftEye = objectMapper.createObjectNode();
                putIfNotNull(leftEye, "sph", detail.getLeftSph());
                putIfNotNull(leftEye, "cyl", detail.getLeftCyl());
                putIfNotNull(leftEye, "axis", detail.getLeftAxis());
                putIfNotNull(leftEye, "addPower", detail.getLeftAdd());
                putIfNotNull(leftEye, "pd", detail.getLeftPd());
                if (leftEye.size() > 0) {
                    spec.set("leftEye", leftEye);
                }

                // Lens metadata per-spec
                ObjectNode meta = objectMapper.createObjectNode();
                putIfNotNull(meta, "lensType", detail.getLensType());
                putIfNotNull(meta, "frameTypePreference", detail.getFrameTypePreference());
                putIfNotNull(meta, "lensMaterial", detail.getLensMaterial());
                putIfNotNull(meta, "lensCoatings", detail.getLensCoatings());
                putIfNotNull(meta, "lensWearType", detail.getLensWearType());
                putIfNotNull(meta, "lensMaterialCl", detail.getLensMaterialCl());
                putIfNotNull(meta, "baseCurve", detail.getBaseCurve());
                putIfNotNull(meta, "diameter", detail.getDiameter());
                if (meta.size() > 0) {
                    spec.set("lensMeta", meta);
                }

                putIfNotNull(spec, "notes", detail.getNotes());

                specs.add(spec);
            }

            root.set("lensSpecifications", specs);
        }

        // Add product recommendations
        List<PrescriptionRecommendation> recs = prescription.getPrescriptionRecommendations();
        if (recs != null && !recs.isEmpty()) {
            ArrayNode recArray = objectMapper.createArrayNode();
            for (PrescriptionRecommendation rec : recs) {
                ObjectNode recNode = objectMapper.createObjectNode();
                recNode.put("productName", rec.getProduct() != null ? rec.getProduct().getProductName() : "Unknown Product");
                recNode.put("quantity", rec.getQuantity());
                if (rec.getStaffNotes() != null && !rec.getStaffNotes().isBlank()) {
                    recNode.put("staffNotes", rec.getStaffNotes());
                }
                recArray.add(recNode);
            }
            root.set("recommendations", recArray);
        }

        return jsonService.toJson(root);
    }

    private void putIfNotNull(ObjectNode node, String field, Object value) {
        if (value != null) {
            if (value instanceof String s && !s.isBlank()) {
                node.put(field, s);
            } else if (value instanceof BigDecimal bd) {
                node.put(field, bd.stripTrailingZeros().toPlainString());
            } else if (value instanceof Integer i) {
                node.put(field, i);
            }
        }
    }

    private boolean hasAnyValue(Object... values) {
        for (Object v : values) {
            if (v != null) {
                if (v instanceof String s && !s.isBlank()) return true;
                if (v instanceof BigDecimal) return true;
                if (v instanceof Integer) return true;
            }
        }
        return false;
    }
}
