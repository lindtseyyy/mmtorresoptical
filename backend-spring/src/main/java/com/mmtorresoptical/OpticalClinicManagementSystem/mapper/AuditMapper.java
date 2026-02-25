package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.AuditDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.AuditLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring"
)
public interface AuditMapper {

    @Mapping(
            target = "actionType",
            expression = "java(auditLog.getActionType().name())"
    )
    @Mapping(
            target = "resourceType",
            expression = "java(auditLog.getResourceType().name())"
    )
    @Mapping(
            target = "userId",
            source = "user.userId"
    )
    AuditDetailsDTO entityToDetailsDTO(AuditLog auditLog);
}
