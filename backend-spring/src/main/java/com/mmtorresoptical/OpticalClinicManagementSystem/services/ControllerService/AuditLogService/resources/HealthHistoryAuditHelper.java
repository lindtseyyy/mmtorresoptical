package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.healthhistory.HealthHistoryAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.HealthHistoryMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HealthHistoryAuditHelper {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final HealthHistoryMapper healthHistoryMapper;

    public void logCreate(HealthHistory healthHistory) {

        HealthHistoryAuditDTO auditDTO =
                healthHistoryMapper.entityToAuditDTO(healthHistory);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.CREATE,
                ResourceType.HEALTH_HISTORY,
                healthHistory.getHistoryId(),
                "Created health history record",
                detailsJson
        );
    }

    public void logUpdate(HealthHistory healthHistoryBefore, HealthHistory healthHistoryAfter) {

        HealthHistoryAuditDTO before =
                healthHistoryMapper.entityToAuditDTO(healthHistoryBefore);

        HealthHistoryAuditDTO after =
                healthHistoryMapper.entityToAuditDTO(healthHistoryAfter);

        AuditUpdateEvent<HealthHistoryAuditDTO> event =
                new AuditUpdateEvent<>(before, after);

        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.HEALTH_HISTORY,
                after.getHistoryId(),
                "Updated health history record",
                detailsJson
        );
    }

    public void logArchive(HealthHistory healthHistory) {

        HealthHistoryAuditDTO auditDTO =
                healthHistoryMapper.entityToAuditDTO(healthHistory);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.HEALTH_HISTORY,
                healthHistory.getHistoryId(),
                "Archived health history record",
                detailsJson
        );
    }

    public void logRestore(HealthHistory healthHistory) {

        HealthHistoryAuditDTO auditDTO =
                healthHistoryMapper.entityToAuditDTO(healthHistory);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.HEALTH_HISTORY,
                healthHistory.getHistoryId(),
                "Restored health history record",
                detailsJson
        );
    }

}
