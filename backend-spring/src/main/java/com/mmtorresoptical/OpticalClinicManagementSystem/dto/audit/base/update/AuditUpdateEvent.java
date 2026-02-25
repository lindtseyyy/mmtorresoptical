package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AuditUpdateEvent<T> {
    private final T before;
    private final T after;
}