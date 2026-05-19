package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.eyeexam.EyeExamAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.EyeExamMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EyeExamAuditHelper {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final EyeExamMapper eyeExamMapper;

    public void logCreate(EyeExam eyeExam) {
        EyeExamAuditDTO auditDTO = eyeExamMapper.entityToAuditDTO(eyeExam);
        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.CREATE,
                ResourceType.EYE_EXAM,
                eyeExam.getEyeExamId(),
                "Created eye exam record",
                detailsJson
        );
    }

    public void logUpdate(EyeExam before, EyeExam after) {
        EyeExamAuditDTO beforeDTO = eyeExamMapper.entityToAuditDTO(before);
        EyeExamAuditDTO afterDTO = eyeExamMapper.entityToAuditDTO(after);
        AuditUpdateEvent<EyeExamAuditDTO> event = new AuditUpdateEvent<>(beforeDTO, afterDTO);
        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.EYE_EXAM,
                after.getEyeExamId(),
                "Updated eye exam record",
                detailsJson
        );
    }

    public void logArchive(EyeExam eyeExam) {
        EyeExamAuditDTO auditDTO = eyeExamMapper.entityToAuditDTO(eyeExam);
        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.EYE_EXAM,
                eyeExam.getEyeExamId(),
                "Archived eye exam record",
                detailsJson
        );
    }

    public void logRestore(EyeExam eyeExam) {
        EyeExamAuditDTO auditDTO = eyeExamMapper.entityToAuditDTO(eyeExam);
        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.EYE_EXAM,
                eyeExam.getEyeExamId(),
                "Restored eye exam record",
                detailsJson
        );
    }
}
