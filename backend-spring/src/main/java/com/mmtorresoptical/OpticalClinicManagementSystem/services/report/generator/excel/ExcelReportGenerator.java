package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.excel;

import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.TabularReportDataset;

import java.io.IOException;
import java.io.OutputStream;

public interface ExcelReportGenerator {
    byte[] generate(TabularReportDataset dataset);

    void write(TabularReportDataset dataset, OutputStream outputStream) throws IOException;
}
