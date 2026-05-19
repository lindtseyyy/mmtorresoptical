package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescription.PrescriptionAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescriptionitem.PrescriptionItemAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.basehelper.AuditLogHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionAuditHelper implements AuditLogHelper<Prescription> {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final PrescriptionMapper prescriptionMapper;
    private final PrescriptionItemMapper prescriptionItemMapper;
    private final ObjectMapper objectMapper;

    @Override
    public void logCreate(Prescription prescription) {
        String detailsJson = buildDetailsJson(prescription);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PRESCRIPTION,
                prescription.getPrescriptionId(),
                "Created prescription record",
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

    private String buildDetailsJson(Prescription prescription) {
        PrescriptionAuditDTO auditDTO = prescriptionMapper.entityToAuditDTO(prescription);
        List<PrescriptionItemAuditDTO> itemDTOs =
                prescriptionItemMapper.entityListToAuditDTOList(prescription.getPrescriptionItems());

        ObjectNode root = objectMapper.valueToTree(auditDTO);

        ArrayNode rightEye = objectMapper.createArrayNode();
        ArrayNode leftEye = objectMapper.createArrayNode();
        ArrayNode bothEyes = objectMapper.createArrayNode();

        for (PrescriptionItemAuditDTO item : itemDTOs) {
            ObjectNode itemNode = objectMapper.valueToTree(item);
            String side = item.getEyeSide() != null ? item.getEyeSide().toUpperCase() : "";
            switch (side) {
                case "RIGHT" -> rightEye.add(itemNode);
                case "LEFT" -> leftEye.add(itemNode);
                case "BOTH" -> bothEyes.add(itemNode);
                default -> rightEye.add(itemNode);
            }
        }

        root.set("rightEye", rightEye);
        root.set("leftEye", leftEye);
        root.set("bothEyes", bothEyes);

        return jsonService.toJson(root);
    }

}