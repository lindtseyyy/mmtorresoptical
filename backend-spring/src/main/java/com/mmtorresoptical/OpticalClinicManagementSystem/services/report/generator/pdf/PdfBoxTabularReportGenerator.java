package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ReportMetadata;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.TabularReportDataset;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class PdfBoxTabularReportGenerator implements PdfReportGenerator {
    private static final PDType1Font HEADER_FONT = PDType1Font.HELVETICA_BOLD;
    private static final PDType1Font BODY_FONT = PDType1Font.HELVETICA;
    private static final float TITLE_FONT_SIZE = 16f;
    private static final float HEADER_FONT_SIZE = 11f;
    private static final float BODY_FONT_SIZE = 10f;
    private static final float MARGIN = 50f;
    private static final float LINE_HEIGHT = 14f;
    private static final float ROW_HEIGHT = 18f;
    private static final float CELL_PADDING = 2f;

    @Override
    public byte[] generate(TabularReportDataset dataset) {
        if (dataset == null) {
            throw new IllegalArgumentException("dataset must not be null");
        }

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            renderDocument(document, dataset);
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate PDF report", exception);
        }
    }

    private void renderDocument(PDDocument document, TabularReportDataset dataset) throws IOException {
        List<String> columns = dataset.getColumns() == null ? Collections.emptyList() : dataset.getColumns();
        List<List<Object>> rows = dataset.getRows() == null ? Collections.emptyList() : dataset.getRows();
        PageState state = startPage(document);
        state = writeMetadataHeader(document, state, dataset.getMetadata());

        if (columns.isEmpty() || rows.isEmpty()) {
            state = writeBodyLine(document, state, dataset.getEmptyMessage());
            state.contentStream.close();
            return;
        }

        float tableWidth = state.page.getMediaBox().getWidth() - (MARGIN * 2);
        float columnWidth = tableWidth / columns.size();

        state = ensureTableHeaderSpace(document, state, columns, columnWidth);
        drawRow(state.contentStream, columns, MARGIN, state.y, columnWidth, true);
        state.y -= ROW_HEIGHT;

        int rowIndex = 0;
        while (rowIndex < rows.size()) {
            if (state.y - ROW_HEIGHT < MARGIN) {
                state.contentStream.close();
                state = startPage(document);
                drawRow(state.contentStream, columns, MARGIN, state.y, columnWidth, true);
                state.y -= ROW_HEIGHT;
            }

            List<String> rowValues = normalizeRow(rows.get(rowIndex), columns.size());
            drawRow(state.contentStream, rowValues, MARGIN, state.y, columnWidth, false);
            state.y -= ROW_HEIGHT;
            rowIndex++;
        }

        state.contentStream.close();
    }

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

    private PageState writeMetadataHeader(PDDocument document,
                                          PageState state,
                                          ReportMetadata metadata) throws IOException {
        String title = resolveTitle(metadata);
        String generatedBy = metadata == null ? "N/A" : metadata.getGeneratedBy();
        Instant generatedAtValue = metadata == null ? null : metadata.getGeneratedAt();
        String generatedAt = generatedAtValue == null
                ? "N/A"
                : DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                    .withZone(ZoneId.systemDefault())
                    .format(generatedAtValue);

        state = ensureSpace(document, state, TITLE_FONT_SIZE + (LINE_HEIGHT * 3) + 20f);

        writeText(state.contentStream, title, MARGIN, state.y, HEADER_FONT, TITLE_FONT_SIZE);
        state.y -= LINE_HEIGHT + 5f;
        writeText(state.contentStream, "Generated By: " + generatedBy, MARGIN, state.y, BODY_FONT, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        writeText(state.contentStream, "Generated At: " + generatedAt, MARGIN, state.y, BODY_FONT, BODY_FONT_SIZE);
        state.y -= 10f;

        state.contentStream.moveTo(MARGIN, state.y);
        state.contentStream.lineTo(state.page.getMediaBox().getWidth() - MARGIN, state.y);
        state.contentStream.stroke();

        state.y -= 20f;

        return state;
    }

    private PageState ensureTableHeaderSpace(PDDocument document,
                                             PageState state,
                                             List<String> headers,
                                             float columnWidth) throws IOException {
        float requiredHeight = (ROW_HEIGHT * 2) + 15f;
        if (state.y - requiredHeight < MARGIN) {
            state.contentStream.close();
            state = startPage(document);
        }
        return state;
    }

    private void drawRow(PDPageContentStream contentStream,
                         List<String> values,
                         float startX,
                         float y,
                         float columnWidth,
                         boolean headerRow) throws IOException {
        PDType1Font font = headerRow ? HEADER_FONT : BODY_FONT;
        float fontSize = headerRow ? HEADER_FONT_SIZE : BODY_FONT_SIZE;

        for (int i = 0; i < values.size(); i++) {
            float cellX = startX + (i * columnWidth);
            contentStream.addRect(cellX, y - ROW_HEIGHT, columnWidth, ROW_HEIGHT);
            contentStream.stroke();

            String text = values.get(i) == null ? "" : values.get(i);
            String fittedText = fitToWidth(text, font, fontSize, columnWidth - (CELL_PADDING * 2));
            float textY = y - 13f;
            writeText(contentStream, fittedText, cellX + CELL_PADDING, textY, font, fontSize);
        }
    }

    private PageState writeBodyLine(PDDocument document, PageState state, String text) throws IOException {
        state = ensureSpace(document, state, LINE_HEIGHT);
        writeText(state.contentStream, text, MARGIN, state.y, BODY_FONT, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        return state;
    }

    private void writeText(PDPageContentStream contentStream,
                           String text,
                           float x,
                           float y,
                           PDType1Font font,
                           float fontSize) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(text == null ? "" : text);
        contentStream.endText();
    }

    private String fitToWidth(String text, PDType1Font font, float fontSize, float maxWidth) throws IOException {
        if (text == null || text.isEmpty()) {
            return "";
        }
        String candidate = text;
        float textWidth = font.getStringWidth(candidate) / 1000f * fontSize;
        if (textWidth <= maxWidth) {
            return candidate;
        }
        String ellipsis = "...";
        int end = candidate.length();
        while (end > 0) {
            String truncated = candidate.substring(0, end) + ellipsis;
            float width = font.getStringWidth(truncated) / 1000f * fontSize;
            if (width <= maxWidth) {
                return truncated;
            }
            end--;
        }
        return "";
    }

    private List<String> normalizeRow(List<Object> row, int size) {
        List<String> result = new ArrayList<>();
        if (row != null) {
            for (Object value : row) {
                result.add(value == null ? "" : value.toString());
            }
        }
        while (result.size() < size) {
            result.add("");
        }
        if (result.size() > size) {
            return result.subList(0, size);
        }
        return result;
    }

    private String resolveTitle(ReportMetadata metadata) {
        if (metadata == null) {
            return "Report";
        }
        if (metadata.getTitle() != null && !metadata.getTitle().isBlank()) {
            return metadata.getTitle();
        }
        if (metadata.getReportType() != null) {
            return metadata.getReportType().name();
        }
        return "Report";
    }

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
