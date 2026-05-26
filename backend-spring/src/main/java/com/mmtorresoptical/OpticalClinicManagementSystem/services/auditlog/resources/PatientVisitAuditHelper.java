package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.PatientVisitAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientVisit;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PatientVisitAuditHelper {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;

    public void logCreate(PatientVisit visit) {
        PatientVisitAuditDTO dto = toAuditDTO(visit);
        String detailsJson = jsonService.toJson(dto);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PATIENT_VISIT,
                visit.getVisitId(),
                "Patient visit logged",
                detailsJson
        );
    }

    private PatientVisitAuditDTO toAuditDTO(PatientVisit entity) {
        PatientVisitAuditDTO dto = new PatientVisitAuditDTO();
        dto.setVisitId(entity.getVisitId());
        if (entity.getPatient() != null) {
            dto.setPatientId(entity.getPatient().getPatientId());
        }
        dto.setVisitTimestamp(entity.getVisitTimestamp());
        dto.setPurpose(entity.getPurpose());
        dto.setNotes(entity.getNotes());
        if (entity.getLoggedBy() != null) {
            dto.setLoggedByUserId(entity.getLoggedBy().getUserId());
        }
        return dto;
    }
}
