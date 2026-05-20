package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.followup.PatientFollowUpAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientFollowUp;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PatientFollowUpAuditHelper {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;

    public void logCreate(PatientFollowUp followUp) {
        PatientFollowUpAuditDTO dto = toAuditDTO(followUp);
        String detailsJson = jsonService.toJson(dto);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PATIENT_FOLLOW_UP,
                followUp.getFollowUpId(),
                "Created patient follow-up record",
                detailsJson
        );
    }

    public void logUpdate(PatientFollowUp before, PatientFollowUp after) {
        PatientFollowUpAuditDTO beforeDTO = toAuditDTO(before);
        PatientFollowUpAuditDTO afterDTO = toAuditDTO(after);
        AuditUpdateEvent<PatientFollowUpAuditDTO> event = new AuditUpdateEvent<>(beforeDTO, afterDTO);
        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.PATIENT_FOLLOW_UP,
                after.getFollowUpId(),
                "Updated patient follow-up record",
                detailsJson
        );
    }

    public void logArchive(PatientFollowUp followUp) {
        PatientFollowUpAuditDTO dto = toAuditDTO(followUp);
        String detailsJson = jsonService.toJson(dto);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.PATIENT_FOLLOW_UP,
                followUp.getFollowUpId(),
                "Archived patient follow-up record",
                detailsJson
        );
    }

    public void logRestore(PatientFollowUp followUp) {
        PatientFollowUpAuditDTO dto = toAuditDTO(followUp);
        String detailsJson = jsonService.toJson(dto);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.PATIENT_FOLLOW_UP,
                followUp.getFollowUpId(),
                "Restored patient follow-up record",
                detailsJson
        );
    }

    private PatientFollowUpAuditDTO toAuditDTO(PatientFollowUp entity) {
        PatientFollowUpAuditDTO dto = new PatientFollowUpAuditDTO();
        dto.setFollowUpId(entity.getFollowUpId());
        if (entity.getPatient() != null) {
            dto.setPatientId(entity.getPatient().getPatientId());
            dto.setPatientName(entity.getPatient().getFirstName() + " " + entity.getPatient().getLastName());
        }
        dto.setPrescriptionId(entity.getPrescription() != null ? entity.getPrescription().getPrescriptionId() : null);
        dto.setEyeExamId(entity.getEyeExam() != null ? entity.getEyeExam().getEyeExamId() : null);
        dto.setScheduledDate(entity.getScheduledDate());
        dto.setActualVisitDate(entity.getActualVisitDate());
        dto.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        dto.setFollowUpReason(entity.getFollowUpReason());
        dto.setIsArchived(entity.getIsArchived());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        if (entity.getCreatedBy() != null) {
            dto.setCreatedByUserId(entity.getCreatedBy().getUserId());
            dto.setCreatedByName(entity.getCreatedBy().getFirstName() + " " + entity.getCreatedBy().getLastName());
            dto.setCreatedByRole(entity.getCreatedBy().getRole() != null ? entity.getCreatedBy().getRole().name() : null);
        }
        return dto;
    }
}
