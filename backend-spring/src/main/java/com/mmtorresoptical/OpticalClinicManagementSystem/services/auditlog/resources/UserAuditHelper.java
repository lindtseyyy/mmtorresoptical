package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.user.UserAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.UserMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.basehelper.AuditLogHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserAuditHelper implements AuditLogHelper<User> {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final UserMapper userMapper;

    @Override
    public void logCreate(User user) {

        UserAuditDTO auditDTO =
                userMapper.entityToAuditDTO(user);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.CREATE,
                ResourceType.USER,
                user.getUserId(),
                "Created user record",
                detailsJson
        );
    }

    @Override
    public void logUpdate(User userBefore, User userAfter) {

        UserAuditDTO before =
                userMapper.entityToAuditDTO(userBefore);

        UserAuditDTO after =
                userMapper.entityToAuditDTO(userAfter);

        AuditUpdateEvent<UserAuditDTO> event =
                new AuditUpdateEvent<>(before, after);

        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.USER,
                after.getUserId(),
                "Updated user record",
                detailsJson
        );
    }

    @Override
    public void logArchive(User user) {

        UserAuditDTO auditDTO =
                userMapper.entityToAuditDTO(user);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.USER,
                user.getUserId(),
                "Archived user record",
                detailsJson
        );
    }

    @Override
    public void logRestore(User user) {

        UserAuditDTO auditDTO =
                userMapper.entityToAuditDTO(user);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.USER,
                user.getUserId(),
                "Restored user record",
                detailsJson
        );
    }

}