package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TabularReportDataset {
    private ReportMetadata metadata;
    private List<String> columns;
    private List<List<Object>> rows;

    public static TabularReportDataset empty(ReportMetadata metadata) {
        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(Collections.emptyList())
                .rows(Collections.emptyList())
                .build();
    }
}
