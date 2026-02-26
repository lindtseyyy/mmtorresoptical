package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.basehelper;

import java.util.List;

public interface BatchAuditLogHelper<T> extends AuditLogHelper<T>{

    void logCreateBatch(List<T> entities);
}
