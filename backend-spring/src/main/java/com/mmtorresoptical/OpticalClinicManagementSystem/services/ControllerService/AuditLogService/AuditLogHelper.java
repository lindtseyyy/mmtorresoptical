package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService;

public interface AuditLogHelper<T> {

    public void logCreate(T entity);
    public void logUpdate(T before, T after);
    public void logArchive(T entity);
    public void logRestore(T entity);
}