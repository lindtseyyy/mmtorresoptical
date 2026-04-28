package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.TabularReportDataset;

public interface PdfReportGenerator {
    byte[] generate(TabularReportDataset dataset);
}
