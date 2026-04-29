package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.PatientReportDataset;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ReportMetadata;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfBoxPatientReportGenerator {

    private static final PDType1Font HEADER_FONT = PDType1Font.HELVETICA_BOLD;
    private static final PDType1Font BODY_FONT = PDType1Font.HELVETICA;
    private static final float TITLE_FONT_SIZE = 16f;
    private static final float SECTION_FONT_SIZE = 13f;
    private static final float HEADER_FONT_SIZE = 11f;
    private static final float BODY_FONT_SIZE = 10f;
    private static final float MARGIN = 50f;
    private static final float LINE_HEIGHT = 15f;
    private static final float ROW_HEIGHT = 20f;
    private static final float CELL_PADDING = 3f;

    public byte[] generate(PatientReportDataset dataset) {
        if (dataset == null) {
            throw new IllegalArgumentException("dataset must not be null");
        }
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            renderDocument(document, dataset);
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate patient report PDF", exception);
        }
    }

    private void renderDocument(PDDocument document, PatientReportDataset dataset) throws IOException {
        PageState state = startPage(document);
        state = writeMetadataHeader(document, state, dataset);

        if (dataset.isOverallReport()) {
            state = writeOverallReport(document, state, dataset);
        } else {
            state = writeDateRangeReport(document, state, dataset);
        }

        state.contentStream.close();
    }

    // ── Overall Clinic Report ────────────────────────────────────────

    private PageState writeOverallReport(PDDocument document, PageState state,
                                         PatientReportDataset dataset) throws IOException {
        state = writePatientSummary(document, state, dataset);
        drawSectionSeparator(state.contentStream, state);
        state = writeGenderDistribution(document, state, dataset);
        drawSectionSeparator(state.contentStream, state);
        state = writeAgeGroupTable(document, state, dataset.getAgeGroupDistribution());
        drawSectionSeparator(state.contentStream, state);
        state = writeVisitStatistics(document, state, dataset);
        drawSectionSeparator(state.contentStream, state);
        state = writeGrowthComparison(document, state, dataset);
        return state;
    }

    // ── Date Range Report ────────────────────────────────────────────

    private PageState writeDateRangeReport(PDDocument document, PageState state,
                                           PatientReportDataset dataset) throws IOException {
        state = writeDateRangePatientSummary(document, state, dataset);
        drawSectionSeparator(state.contentStream, state);
        state = writeGenderDistribution(document, state, dataset);
        drawSectionSeparator(state.contentStream, state);
        state = writeAgeGroupTable(document, state, dataset.getAgeGroupDistribution());
        drawSectionSeparator(state.contentStream, state);
        state = writeVisitStatistics(document, state, dataset);
        return state;
    }

    // ── Sections ─────────────────────────────────────────────────────

    private PageState writePatientSummary(PDDocument document, PageState state,
                                          PatientReportDataset dataset) throws IOException {
        state = writeSectionHeader(document, state, "Patient Summary");
        state = writeKeyValueLine(document, state, "Total Patients", String.valueOf(dataset.getTotalPatients()));
        state = writeKeyValueLine(document, state, "Active Patients", String.valueOf(dataset.getActivePatients()));
        state = writeKeyValueLine(document, state, "Archived Patients", String.valueOf(dataset.getArchivedPatients()));
        return state;
    }

    private PageState writeDateRangePatientSummary(PDDocument document, PageState state,
                                                   PatientReportDataset dataset) throws IOException {
        state = writeSectionHeader(document, state, "Patient Summary");
        state = writeKeyValueLine(document, state, "New Patients Registered",
                String.valueOf(dataset.getNewPatientsInPeriod()));
        state = writeKeyValueLine(document, state, "Active Patients (Total)",
                String.valueOf(dataset.getActivePatients()));
        return state;
    }

    private PageState writeGenderDistribution(PDDocument document, PageState state,
                                              PatientReportDataset dataset) throws IOException {
        state = writeSectionHeader(document, state, "Gender Distribution");
        state = writeKeyValueLine(document, state, "Male", String.valueOf(dataset.getMaleCount()));
        state = writeKeyValueLine(document, state, "Female", String.valueOf(dataset.getFemaleCount()));
        if (dataset.getOtherGenderCount() > 0) {
            state = writeKeyValueLine(document, state, "Other", String.valueOf(dataset.getOtherGenderCount()));
        }
        return state;
    }

    private PageState writeAgeGroupTable(PDDocument document, PageState state,
                                         List<PatientReportDataset.AgeGroupStat> ageGroups) throws IOException {
        state = writeSectionHeader(document, state, "Age Group Distribution");

        if (ageGroups == null || ageGroups.isEmpty()) {
            state = writeBodyLine(document, state, "No age group data available.");
            return state;
        }

        List<String> headers = List.of("Age Group", "Count");
        float tableWidth = state.page.getMediaBox().getWidth() - (MARGIN * 2);
        float[] columnWidths = new float[]{tableWidth * 0.70f, tableWidth * 0.30f};

        state = ensureSpace(document, state, ROW_HEIGHT * 2);
        drawRow(state.contentStream, headers, MARGIN, state.y, columnWidths, true);
        state.y -= ROW_HEIGHT;

        for (PatientReportDataset.AgeGroupStat group : ageGroups) {
            if (state.y - ROW_HEIGHT < MARGIN) {
                state.contentStream.close();
                state = startPage(document);
                drawRow(state.contentStream, headers, MARGIN, state.y, columnWidths, true);
                state.y -= ROW_HEIGHT;
            }
            List<String> values = List.of(group.groupLabel(), String.valueOf(group.count()));
            drawRow(state.contentStream, values, MARGIN, state.y, columnWidths, false);
            state.y -= ROW_HEIGHT;
        }

        return state;
    }

    private PageState writeVisitStatistics(PDDocument document, PageState state,
                                           PatientReportDataset dataset) throws IOException {
        state = writeSectionHeader(document, state, "Visit Statistics");
        state = writeKeyValueLine(document, state, "Total Visits", String.valueOf(dataset.getTotalVisits()));
        state = writeKeyValueLine(document, state, "Completed", String.valueOf(dataset.getCompletedVisits()));
        state = writeKeyValueLine(document, state, "Missed / Cancelled",
                String.valueOf(dataset.getMissedOrCancelledVisits()));
        return state;
    }

    private PageState writeGrowthComparison(PDDocument document, PageState state,
                                            PatientReportDataset dataset) throws IOException {
        state = writeSectionHeader(document, state, "Growth Comparison");

        if (!dataset.isGrowthComparisonAvailable()) {
            state = writeBodyLine(document, state, "Insufficient data for growth comparison.");
            return state;
        }

        state = writeKeyValueLine(document, state, dataset.getCurrentPeriodLabel(),
                String.valueOf(dataset.getCurrentPeriodCount()) + " patients");
        state = writeKeyValueLine(document, state, dataset.getPreviousPeriodLabel(),
                String.valueOf(dataset.getPreviousPeriodCount()) + " patients");

        String growthStr = String.format("%+.2f%%", dataset.getGrowthPercentage());
        state = writeKeyValueLine(document, state, "Growth", growthStr);

        float indicatorX = MARGIN + 24f;
        state = ensureSpace(document, state, LINE_HEIGHT);
        if (dataset.getGrowthPercentage() > 0) {
            writeText(state.contentStream, "[+] Positive growth", indicatorX, state.y,
                    BODY_FONT, BODY_FONT_SIZE);
        } else if (dataset.getGrowthPercentage() < 0) {
            writeText(state.contentStream, "[-] Decline", indicatorX, state.y,
                    BODY_FONT, BODY_FONT_SIZE);
        } else {
            writeText(state.contentStream, "[~] No change", indicatorX, state.y,
                    BODY_FONT, BODY_FONT_SIZE);
        }
        state.y -= LINE_HEIGHT;

        return state;
    }

    // ── Layout helpers ───────────────────────────────────────────────

    private PageState startPage(PDDocument document) throws IOException {
        PDPage page = new PDPage(PDRectangle.LETTER);
        document.addPage(page);
        PDPageContentStream contentStream = new PDPageContentStream(document, page);
        float y = page.getMediaBox().getHeight() - MARGIN;
        return new PageState(page, contentStream, y);
    }

    private PageState ensureSpace(PDDocument document, PageState state, float requiredHeight) throws IOException {
        if (state.y - requiredHeight < MARGIN) {
            state.contentStream.close();
            return startPage(document);
        }
        return state;
    }

    private PageState writeMetadataHeader(PDDocument document, PageState state,
                                          PatientReportDataset dataset) throws IOException {
        ReportMetadata metadata = dataset.getMetadata();
        String title = metadata != null && metadata.getTitle() != null
                ? metadata.getTitle() : "Patient Report";
        String generatedBy = metadata != null ? metadata.getGeneratedBy() : "N/A";
        String generatedAt = metadata != null && metadata.getGeneratedAt() != null
                ? DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                    .withZone(ZoneId.systemDefault())
                    .format(metadata.getGeneratedAt())
                : "N/A";

        state = ensureSpace(document, state, TITLE_FONT_SIZE + (LINE_HEIGHT * 5) + 20f);

        writeText(state.contentStream, title, MARGIN, state.y, HEADER_FONT, TITLE_FONT_SIZE);
        state.y -= LINE_HEIGHT + 6f;
        writeText(state.contentStream, "Generated By: " + generatedBy, MARGIN, state.y, BODY_FONT, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        writeText(state.contentStream, "Generated At: " + generatedAt, MARGIN, state.y, BODY_FONT, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;

        if (!dataset.isOverallReport() && dataset.getMinDate() != null && dataset.getMaxDate() != null) {
            String range = "Period: " + dataset.getMinDate() + " to " + dataset.getMaxDate();
            writeText(state.contentStream, range, MARGIN, state.y, BODY_FONT, BODY_FONT_SIZE);
            state.y -= LINE_HEIGHT;
        }

        state.y -= 10f;
        drawHorizontalRule(state.contentStream, state);
        state.y -= 26f;

        return state;
    }

    private PageState writeSectionHeader(PDDocument document, PageState state, String title) throws IOException {
        float required = SECTION_FONT_SIZE + LINE_HEIGHT + 4f;
        state = ensureSpace(document, state, required);
        state.y -= 6f;
        writeText(state.contentStream, title, MARGIN, state.y, HEADER_FONT, SECTION_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        return state;
    }

    private void drawSectionSeparator(PDPageContentStream contentStream, PageState state) throws IOException {
        state.y -= 8f;
        drawHorizontalRule(contentStream, state);
        state.y -= 14f;
    }

    private PageState writeKeyValueLine(PDDocument document, PageState state,
                                        String label, String value) throws IOException {
        state = ensureSpace(document, state, LINE_HEIGHT);
        float labelX = MARGIN + 12f;
        writeText(state.contentStream, label + ":", labelX, state.y, BODY_FONT, BODY_FONT_SIZE);
        writeText(state.contentStream, value, labelX + 160f, state.y, HEADER_FONT, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        return state;
    }

    private PageState writeBodyLine(PDDocument document, PageState state, String text) throws IOException {
        state = ensureSpace(document, state, LINE_HEIGHT);
        writeText(state.contentStream, text, MARGIN + 12f, state.y, BODY_FONT, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        return state;
    }

    private void drawRow(PDPageContentStream contentStream, List<String> values,
                         float startX, float y, float[] columnWidths, boolean headerRow) throws IOException {
        PDType1Font font = headerRow ? HEADER_FONT : BODY_FONT;
        float fontSize = headerRow ? HEADER_FONT_SIZE : BODY_FONT_SIZE;

        float currentX = startX;
        for (int i = 0; i < values.size() && i < columnWidths.length; i++) {
            float width = columnWidths[i];
            contentStream.addRect(currentX, y - ROW_HEIGHT, width, ROW_HEIGHT);
            contentStream.stroke();

            String text = values.get(i) == null ? "" : values.get(i);
            String fitted = fitToWidth(text, font, fontSize, width - (CELL_PADDING * 2));
            float textY = y - 14f;
            writeText(contentStream, fitted, currentX + CELL_PADDING, textY, font, fontSize);
            currentX += width;
        }
    }

    private void drawHorizontalRule(PDPageContentStream contentStream, PageState state) throws IOException {
        contentStream.moveTo(MARGIN, state.y);
        contentStream.lineTo(state.page.getMediaBox().getWidth() - MARGIN, state.y);
        contentStream.stroke();
    }

    // ── Text utilities ───────────────────────────────────────────────

    private void writeText(PDPageContentStream contentStream, String text,
                           float x, float y, PDType1Font font, float fontSize) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(text == null ? "" : text);
        contentStream.endText();
    }

    private String fitToWidth(String text, PDType1Font font, float fontSize, float maxWidth) throws IOException {
        if (text == null || text.isEmpty()) return "";
        if (font.getStringWidth(text) / 1000f * fontSize <= maxWidth) return text;
        String ellipsis = "...";
        int end = text.length();
        while (end > 0) {
            String truncated = text.substring(0, end) + ellipsis;
            if (font.getStringWidth(truncated) / 1000f * fontSize <= maxWidth) return truncated;
            end--;
        }
        return "";
    }

    // ── Page state ───────────────────────────────────────────────────

    private static class PageState {
        private final PDPage page;
        private final PDPageContentStream contentStream;
        private float y;

        private PageState(PDPage page, PDPageContentStream contentStream, float y) {
            this.page = page;
            this.contentStream = contentStream;
            this.y = y;
        }
    }
}
