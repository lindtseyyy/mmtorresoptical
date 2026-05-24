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
            List<LensSpecificationDTO> lensDTOs = prescriptionLensDetailMapper.entityListToDTOList(lensDetails);
            ArrayNode lensArray = objectMapper.valueToTree(lensDTOs);
            root.set("lensSpecifications", lensArray);
        }

        return jsonService.toJson(root);
    }
}
