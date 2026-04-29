package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.report.ReportExportAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ReportMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ReportAuditHelper {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;

    public void logExport(ReportMetadata metadata, LocalDate minDate, LocalDate maxDate) {
        ReportExportAuditDTO dto = new ReportExportAuditDTO(
                metadata.getReportType() != null ? metadata.getReportType().name() : null,
                metadata.getTitle(),
                minDate,
                maxDate,
                metadata.getGeneratedAt(),
                metadata.getGeneratedBy()
        );

        String details = "Exported " + metadata.getTitle() + " report";

        auditLogService.log(
                ActionType.EXPORT,
                ResourceType.REPORT,
                null,
                details,
                jsonService.toJson(dto)
        );
    }
}
