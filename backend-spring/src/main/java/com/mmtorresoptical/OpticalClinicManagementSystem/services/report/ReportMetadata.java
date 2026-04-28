package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportMetadata {
    private Instant generatedAt;
    private String generatedBy;
    private ReportType reportType;
    private String title;
}
