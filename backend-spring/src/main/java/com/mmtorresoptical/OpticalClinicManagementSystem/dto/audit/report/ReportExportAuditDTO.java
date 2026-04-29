package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.report;

import java.time.Instant;
import java.time.LocalDate;

public record ReportExportAuditDTO(
        String reportType,
        String title,
        LocalDate minDate,
        LocalDate maxDate,
        Instant generatedAt,
        String generatedBy
) {}
