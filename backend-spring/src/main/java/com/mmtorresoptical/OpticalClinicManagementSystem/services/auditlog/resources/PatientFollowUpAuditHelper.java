package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
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
        String detailsJson = jsonService.toJson(followUp);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PATIENT_FOLLOW_UP,
                followUp.getFollowUpId(),
                "Created patient follow-up record",
                detailsJson
        );
    }

    public void logUpdate(PatientFollowUp before, PatientFollowUp after) {
        String beforeJson = jsonService.toJson(before);
        String afterJson = jsonService.toJson(after);
        AuditUpdateEvent<String> event = new AuditUpdateEvent<>(beforeJson, afterJson);
        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.PATIENT_FOLLOW_UP,
                after.getFollowUpId(),
                "Updated patient follow-up record",
                detailsJson
        );
    }
}
