package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescription.PrescriptionAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.basehelper.AuditLogHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PrescriptionAuditHelper implements AuditLogHelper<Prescription> {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final PrescriptionMapper prescriptionMapper;

    @Override
    public void logCreate(Prescription prescription) {

        PrescriptionAuditDTO auditDTO =
                prescriptionMapper.entityToAuditDTO(prescription);

        String detailsJson = jsonService.toJson(auditDTO);
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

        PrescriptionAuditDTO auditDTO =
                prescriptionMapper.entityToAuditDTO(prescription);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.PRESCRIPTION,
                prescription.getPrescriptionId(),
                "Archived prescription record",
                detailsJson
        );
    }

    @Override
    public void logRestore(Prescription prescription) {

        PrescriptionAuditDTO auditDTO =
                prescriptionMapper.entityToAuditDTO(prescription);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.PRESCRIPTION,
                prescription.getPrescriptionId(),
                "Restored prescription record",
                detailsJson
        );
    }

}