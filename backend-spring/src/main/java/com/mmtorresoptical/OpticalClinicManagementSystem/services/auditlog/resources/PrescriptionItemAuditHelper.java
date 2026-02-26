package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.prescriptionitem.PrescriptionItemAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.basehelper.BatchAuditLogHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionItemAuditHelper implements BatchAuditLogHelper<PrescriptionItem> {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final PrescriptionItemMapper prescriptionItemMapper;

    @Override
    public void logCreate(PrescriptionItem prescriptionItem) {

        PrescriptionItemAuditDTO auditDTO =
                prescriptionItemMapper.entityToAuditDTO(prescriptionItem);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PRESCRIPTION_ITEM,
                prescriptionItem.getPrescription().getPrescriptionId(),
                "Created prescription item record",
                detailsJson
        );
    }

    @Override
    public void logCreateBatch(List<PrescriptionItem> prescriptionItems) {
        List<PrescriptionItemAuditDTO> auditDTOs =
                prescriptionItemMapper.entityListToAuditDTOList(prescriptionItems);

        int count = prescriptionItems.size();

        String detailsJson = jsonService.toJson(auditDTOs);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PRESCRIPTION_ITEM,
                prescriptionItems.get(0).getPrescription().getPrescriptionId(),
                "Created " + count + " prescription item records",
                detailsJson
        );
    }

    @Override
    public void logUpdate(PrescriptionItem beforePrescriptionItem, PrescriptionItem afterPrescriptionItem) {

        PrescriptionItemAuditDTO before =
                prescriptionItemMapper.entityToAuditDTO(beforePrescriptionItem);

        PrescriptionItemAuditDTO after =
                prescriptionItemMapper.entityToAuditDTO(afterPrescriptionItem);

        AuditUpdateEvent<PrescriptionItemAuditDTO> event =
                new AuditUpdateEvent<>(before, after);

        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.PRESCRIPTION_ITEM,
                after.getPrescriptionItemId(),
                "Updated prescription item record",
                detailsJson
        );
    }

    @Override
    public void logArchive(PrescriptionItem prescriptionItem) {

        PrescriptionItemAuditDTO auditDTO =
                prescriptionItemMapper.entityToAuditDTO(prescriptionItem);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.PRESCRIPTION_ITEM,
                prescriptionItem.getPrescriptionItemId(),
                "Archived prescription item record",
                detailsJson
        );
    }

    @Override
    public void logRestore(PrescriptionItem prescriptionItem) {

        PrescriptionItemAuditDTO auditDTO =
                prescriptionItemMapper.entityToAuditDTO(prescriptionItem);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.PRESCRIPTION_ITEM,
                prescriptionItem.getPrescriptionItemId(),
                "Restored prescription item record",
                detailsJson
        );
    }

}