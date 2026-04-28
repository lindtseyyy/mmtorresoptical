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
        String title = resolveTitle(dataset.getMetadata());

        if (columns.isEmpty()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float y = page.getMediaBox().getHeight() - MARGIN;
                y = writeTitle(contentStream, title, y);
                writeText(contentStream, "No data available", MARGIN, y - ROW_HEIGHT, BODY_FONT, BODY_FONT_SIZE);
            }
            return;
        }

        int rowIndex = 0;
        while (rowIndex < rows.size()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float y = page.getMediaBox().getHeight() - MARGIN;
                y = writeTitle(contentStream, title, y);
                float tableWidth = page.getMediaBox().getWidth() - (MARGIN * 2);
                float columnWidth = tableWidth / columns.size();

                float tableTopY = y - ROW_HEIGHT;
                drawRow(contentStream, columns, MARGIN, tableTopY, columnWidth, true);
                float currentY = tableTopY - ROW_HEIGHT;

                while (rowIndex < rows.size()) {
                    if (currentY < MARGIN + ROW_HEIGHT) {
                        break;
                    }
                    List<String> rowValues = normalizeRow(rows.get(rowIndex), columns.size());
                    drawRow(contentStream, rowValues, MARGIN, currentY, columnWidth, false);
                    rowIndex++;
                    currentY -= ROW_HEIGHT;
                }
            }
        }

        if (rows.isEmpty()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float y = page.getMediaBox().getHeight() - MARGIN;
                y = writeTitle(contentStream, title, y);
                writeText(contentStream, "No data available", MARGIN, y - ROW_HEIGHT, BODY_FONT, BODY_FONT_SIZE);
            }
        }
    }

    private float writeTitle(PDPageContentStream contentStream, String title, float y) throws IOException {
        writeText(contentStream, title, MARGIN, y, HEADER_FONT, TITLE_FONT_SIZE);
        return y - (TITLE_FONT_SIZE + 8f);
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
            float textY = y - (ROW_HEIGHT - fontSize) / 2f - 2f;
            writeText(contentStream, fittedText, cellX + CELL_PADDING, textY, font, fontSize);
        }
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
}
