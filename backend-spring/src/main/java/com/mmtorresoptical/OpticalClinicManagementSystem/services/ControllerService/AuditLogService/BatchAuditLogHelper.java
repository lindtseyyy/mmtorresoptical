package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService;

import java.util.List;

public interface BatchAuditLogHelper<T> extends AuditLogHelper<T>{

    void logCreateBatch(List<T> entities);
}
