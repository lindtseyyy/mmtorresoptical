package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.RefundStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ReportMetadata;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PdfBoxTransactionReportGenerator {

    private static final String[] FONT_PATHS_REGULAR = {
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf"
    };
    private static final String[] FONT_PATHS_BOLD = {
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/liberation-sans/LiberationSans-Bold.ttf"
    };
    private static final String[] FONT_PATHS_ITALIC = {
            "/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf",
            "/usr/share/fonts/liberation-sans/LiberationSans-Italic.ttf"
    };
    private static final float TITLE_FONT_SIZE = 16f;
    private static final float SECTION_FONT_SIZE = 13f;
    private static final float SUBSECTION_FONT_SIZE = 11f;
    private static final float HEADER_FONT_SIZE = 10f;
    private static final float BODY_FONT_SIZE = 9f;
    private static final float SMALL_FONT_SIZE = 8f;
    private static final float MARGIN = 50f;
    private static final float LINE_HEIGHT = 14f;
    private static final float ROW_HEIGHT = 16f;
    private static final float CELL_PADDING = 2f;

    private static final DateTimeFormatter DATE_TIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public byte[] generate(TransactionHierarchicalReportDataset dataset) {
        if (dataset == null) {
            throw new IllegalArgumentException("dataset must not be null");
        }

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            renderDocument(document, dataset);
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate transaction PDF report", exception);
        }
    }

    private void renderDocument(PDDocument document,
                                TransactionHierarchicalReportDataset dataset) throws IOException {
        PDFont headerFont = loadFont(document, FONT_PATHS_BOLD, PDType1Font.HELVETICA_BOLD);
        PDFont bodyFont = loadFont(document, FONT_PATHS_REGULAR, PDType1Font.HELVETICA);
        PDFont italicFont = loadFont(document, FONT_PATHS_ITALIC, PDType1Font.HELVETICA_OBLIQUE);

        PageState state = startPage(document, headerFont, bodyFont, italicFont);
        state = writeReportHeader(document, state, dataset);

        Map<String, List<TransactionEntry>> statusGroups = dataset.getStatusGroups();
        if (statusGroups == null || statusGroups.isEmpty()) {
            state = writeBodyLine(document, state, dataset.getEmptyMessage());
            state.contentStream.close();
            return;
        }

        state = writeOverallSummary(document, state, dataset.getSummary());

        for (Map.Entry<String, List<TransactionEntry>> group : statusGroups.entrySet()) {
            state = writeStatusGroupSection(document, state, group.getKey(), group.getValue());
        }

        state.contentStream.close();
    }

    private PageState writeReportHeader(PDDocument document,
                                        PageState state,
                                        TransactionHierarchicalReportDataset dataset) throws IOException {
        ReportMetadata metadata = dataset.getMetadata();
        String title = resolveTitle(metadata);
        String generatedBy = metadata != null ? metadata.getGeneratedBy() : "N/A";
        String generatedAt = metadata != null && metadata.getGeneratedAt() != null
                ? DATE_TIME_FMT.withZone(ZoneId.systemDefault()).format(metadata.getGeneratedAt())
                : "N/A";

        String dateRange = formatDateRange(dataset.getMinDate(), dataset.getMaxDate());

        float requiredHeight = TITLE_FONT_SIZE + (LINE_HEIGHT * 4) + 25f;
        state = ensureSpace(document, state, requiredHeight);

        writeText(state.contentStream, title, MARGIN, state.y, state.headerFont, TITLE_FONT_SIZE);
        state.y -= LINE_HEIGHT + 5f;
        writeText(state.contentStream, "Generated By: " + generatedBy,
                MARGIN, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        writeText(state.contentStream, "Generated At: " + generatedAt,
                MARGIN, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        if (dateRange != null) {
            writeText(state.contentStream, "Date Range: " + dateRange,
                    MARGIN, state.y, state.bodyFont, BODY_FONT_SIZE);
            state.y -= LINE_HEIGHT;
        }

        state.y -= 2f;
        drawHorizontalLine(state, MARGIN, state.page.getMediaBox().getWidth() - MARGIN);
        state.y -= 15f;

        return state;
    }

    private PageState writeOverallSummary(PDDocument document,
                                          PageState state,
                                          TransactionReportSummary summary) throws IOException {
        if (summary == null) {
            return state;
        }

        state = ensureSpace(document, state, SUBSECTION_FONT_SIZE + (LINE_HEIGHT * 4) + 20f);

        writeText(state.contentStream, "Overall Summary", MARGIN, state.y, state.headerFont, SUBSECTION_FONT_SIZE);
        state.y -= LINE_HEIGHT + 4f;

        writeText(state.contentStream,
                "Total Transactions: " + summary.getTotalCount()
                        + "    |    Total Amount: " + formatCurrency(summary.getTotalAmount()),
                MARGIN + 10f, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;

        writeText(state.contentStream,
                "Completed: " + summary.getCompletedCount()
                        + " (" + formatCurrency(summary.getCompletedAmount()) + ")"
                        + "    |    Voided: " + summary.getVoidedCount()
                        + " (" + formatCurrency(summary.getVoidedAmount()) + ")"
                        + "    |    Refunded: " + summary.getRefundedCount()
                        + " (" + formatCurrency(summary.getRefundedAmount()) + ")",
                MARGIN + 10f, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT + 20f;

        return state;
    }

    private PageState writeStatusGroupSection(PDDocument document,
                                              PageState state,
                                              String statusLabel,
                                              List<TransactionEntry> transactions) throws IOException {

        float headerHeight = SECTION_FONT_SIZE + LINE_HEIGHT + 30f;
        state = ensureSpace(document, state, headerHeight);

        drawThickHorizontalLine(state, MARGIN, state.page.getMediaBox().getWidth() - MARGIN);
        state.y -= 18f;

        String sectionTitle = statusLabel.replace("_", " ") + " TRANSACTIONS";
        writeText(state.contentStream, sectionTitle, MARGIN, state.y, state.headerFont, SECTION_FONT_SIZE);
        state.y -= LINE_HEIGHT + 10f;

        for (int i = 0; i < transactions.size(); i++) {
            state = writeTransactionBlock(document, state, transactions.get(i));

            if (i < transactions.size() - 1) {
                state = ensureSpace(document, state, LINE_HEIGHT);
                drawDashedLine(state, MARGIN + 20f, state.page.getMediaBox().getWidth() - MARGIN - 20f);
                state.y -= 10f;
            }
        }

        state.y -= 10f;
        return state;
    }

    private PageState writeTransactionBlock(PDDocument document,
                                            PageState state,
                                            TransactionEntry entry) throws IOException {
        float indent = MARGIN + 15f;

        state = ensureSpace(document, state, LINE_HEIGHT * 6 + 20f);

        writeText(state.contentStream, "Transaction: " + formatUuid(entry.getId()),
                indent, state.y, state.headerFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;

        writeText(state.contentStream, "Date: " + formatDateTime(entry.getDate()),
                indent, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;

        writeText(state.contentStream, "Status: " + entry.getStatus().name(),
                indent, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;

        writeText(state.contentStream, "Total Amount: " + formatCurrency(entry.getTotalAmount()),
                indent, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;

        if (entry.getAmountPaid() != null && entry.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            writeText(state.contentStream, "Amount Paid: " + formatCurrency(entry.getAmountPaid()),
                    indent, state.y, state.bodyFont, BODY_FONT_SIZE);
            state.y -= LINE_HEIGHT;
        }

        if (entry.getBalanceDue() != null && entry.getBalanceDue().compareTo(BigDecimal.ZERO) > 0) {
            writeText(state.contentStream, "Balance Due: " + formatCurrency(entry.getBalanceDue()),
                    indent, state.y, state.bodyFont, BODY_FONT_SIZE);
            state.y -= LINE_HEIGHT;
        }

        if (entry.getCustomerName() != null && !entry.getCustomerName().isBlank()) {
            writeText(state.contentStream, "Customer: " + entry.getCustomerName(),
                    indent, state.y, state.bodyFont, BODY_FONT_SIZE);
            state.y -= LINE_HEIGHT;
        }

        if (entry.getCashierName() != null && !entry.getCashierName().isBlank()) {
            writeText(state.contentStream, "Processed By: " + entry.getCashierName(),
                    indent, state.y, state.bodyFont, BODY_FONT_SIZE);
            state.y -= LINE_HEIGHT;
        }

        // Payment history
        if (entry.getPayments() != null && !entry.getPayments().isEmpty()) {
            state.y -= 4f;
            writeText(state.contentStream, "Payments:", indent, state.y, state.headerFont, SMALL_FONT_SIZE);
            state.y -= LINE_HEIGHT;
            for (PaymentMethodEntry pmt : entry.getPayments()) {
                String ref = pmt.getReferenceNumber() != null ? " (Ref: " + pmt.getReferenceNumber() + ")" : "";
                writeText(state.contentStream,
                    formatDateTime(pmt.getCreatedAt()) + " - " + pmt.getPaymentMethod()
                        + " - " + formatCurrency(pmt.getAmount()) + ref,
                    indent + 10f, state.y, state.bodyFont, SMALL_FONT_SIZE);
                state.y -= LINE_HEIGHT;
            }
        }

        state = writeStatusSpecificDetails(document, state, entry, indent);

        state = writeItemsSection(document, state, entry, indent);

        state.y -= 6f;
        return state;
    }

    private PageState writeStatusSpecificDetails(PDDocument document,
                                                 PageState state,
                                                 TransactionEntry entry,
                                                 float indent) throws IOException {
        if (entry.getStatus() == TransactionStatus.VOIDED) {
            state = ensureSpace(document, state, LINE_HEIGHT * 3);
            state.y -= 3f;
            writeText(state.contentStream, "*** VOIDED ***",
                    indent, state.y, state.headerFont, BODY_FONT_SIZE);
            state.y -= LINE_HEIGHT;

            if (entry.getVoidReason() != null && !entry.getVoidReason().isBlank()) {
                writeText(state.contentStream, "Reason: " + entry.getVoidReason(),
                        indent, state.y, state.bodyFont, BODY_FONT_SIZE);
                state.y -= LINE_HEIGHT;
            }
            if (entry.getVoidedBy() != null && !entry.getVoidedBy().isBlank()) {
                writeText(state.contentStream, "Voided By: " + entry.getVoidedBy(),
                        indent, state.y, state.bodyFont, BODY_FONT_SIZE);
                state.y -= LINE_HEIGHT;
            }
            if (entry.getVoidedAt() != null) {
                writeText(state.contentStream, "Voided At: " + formatDateTime(entry.getVoidedAt()),
                        indent, state.y, state.bodyFont, BODY_FONT_SIZE);
                state.y -= LINE_HEIGHT;
            }
        }

        return state;
    }

    private PageState writeItemsSection(PDDocument document,
                                        PageState state,
                                        TransactionEntry entry,
                                        float indent) throws IOException {
        List<TransactionItemEntry> items = entry.getItems();
        if (items == null || items.isEmpty()) {
            return state;
        }

        state.y -= 8f;

        if (entry.getRefundStatus() == RefundStatus.ADJUSTED) {
            List<TransactionItemEntry> refundedItems = new ArrayList<>();
            List<TransactionItemEntry> nonRefundedItems = new ArrayList<>();

            for (TransactionItemEntry item : items) {
                if (item.getRefundedQuantity() != null && item.getRefundedQuantity() > 0) {
                    refundedItems.add(item);
                } else {
                    nonRefundedItems.add(item);
                }
            }

            if (!nonRefundedItems.isEmpty()) {
                state = ensureSpace(document, state, LINE_HEIGHT + ROW_HEIGHT * 2 + 10f);
                writeText(state.contentStream, "Non-Refunded Items:",
                        indent, state.y, state.headerFont, SMALL_FONT_SIZE);
                state.y -= 10f;
                state = writeItemsTable(document, state, nonRefundedItems, indent, false);
            }

            if (!refundedItems.isEmpty()) {
                state.y -= 10f;
                state = ensureSpace(document, state, LINE_HEIGHT + ROW_HEIGHT * 2 + 10f);
                writeText(state.contentStream, "Refunded Items:",
                        indent, state.y, state.headerFont, SMALL_FONT_SIZE);
                state.y -= 10f;
                state = writeItemsTable(document, state, refundedItems, indent, true);
            }

        } else if (entry.getRefundStatus() == RefundStatus.RETURNED) {
            state = ensureSpace(document, state, LINE_HEIGHT + ROW_HEIGHT * 2 + 10f);
            writeText(state.contentStream, "Refunded Items (All items refunded):",
                    indent, state.y, state.headerFont, SMALL_FONT_SIZE);
            state.y -= 10f;
            state = writeItemsTable(document, state, items, indent, true);

        } else {
            state = ensureSpace(document, state, LINE_HEIGHT + ROW_HEIGHT * 2 + 10f);
            writeText(state.contentStream, "Items:",
                    indent, state.y, state.headerFont, SMALL_FONT_SIZE);
            state.y -= 10f;
            state = writeItemsTable(document, state, items, indent, false);
        }

        return state;
    }

    private PageState writeItemsTable(PDDocument document,
                                      PageState state,
                                      List<TransactionItemEntry> items,
                                      float indent,
                                      boolean showRefundColumns) throws IOException {
        float tableWidth = state.page.getMediaBox().getWidth() - indent - MARGIN;

        List<String> headers;
        float[] columnWidths;

        if (showRefundColumns) {
            headers = List.of("Product", "Qty", "Price", "Discount", "Subtotal", "Ref Qty", "Ref Amt");
            columnWidths = new float[]{
                    tableWidth * 0.25f, tableWidth * 0.08f, tableWidth * 0.13f,
                    tableWidth * 0.14f, tableWidth * 0.14f, tableWidth * 0.10f, tableWidth * 0.16f
            };
        } else {
            headers = List.of("Product", "Qty", "Unit Price", "Discount", "Subtotal");
            columnWidths = new float[]{
                    tableWidth * 0.32f, tableWidth * 0.10f, tableWidth * 0.18f,
                    tableWidth * 0.18f, tableWidth * 0.22f
            };
        }

        state = ensureSpace(document, state, ROW_HEIGHT * 2);
        drawItemRow(state, headers, indent, state.y, columnWidths, true);
        state.y -= ROW_HEIGHT;

        for (TransactionItemEntry item : items) {
            if (state.y - ROW_HEIGHT < MARGIN) {
                state.contentStream.close();
                state = startPage(document, state.headerFont, state.bodyFont, state.italicFont);
                drawItemRow(state, headers, indent, state.y, columnWidths, true);
                state.y -= ROW_HEIGHT;
            }

            List<String> values;
            if (showRefundColumns) {
                values = List.of(
                        safe(item.getProductName()), safeInt(item.getQuantity()),
                        formatCurrency(item.getUnitPrice()), formatDiscount(item),
                        formatCurrency(item.getSubtotal()), safeInt(item.getRefundedQuantity()),
                        formatCurrency(item.getRefundAmount())
                );
            } else {
                values = List.of(
                        safe(item.getProductName()), safeInt(item.getQuantity()),
                        formatCurrency(item.getUnitPrice()), formatDiscount(item),
                        formatCurrency(item.getSubtotal())
                );
            }

            drawItemRow(state, values, indent, state.y, columnWidths, false);
            state.y -= ROW_HEIGHT;
        }

        state.y -= 8f;
        return state;
    }

    private void drawItemRow(PageState state, List<String> values, float startX,
                             float y, float[] columnWidths, boolean headerRow) throws IOException {
        PDFont font = headerRow ? state.headerFont : state.bodyFont;
        float fontSize = SMALL_FONT_SIZE;

        float currentX = startX;
        for (int i = 0; i < values.size() && i < columnWidths.length; i++) {
            float colWidth = columnWidths[i];
            state.contentStream.addRect(currentX, y - ROW_HEIGHT, colWidth, ROW_HEIGHT);
            state.contentStream.stroke();

            String text = values.get(i) == null ? "" : values.get(i);
            String fittedText = fitToWidth(text, font, fontSize, colWidth - (CELL_PADDING * 2));
            writeText(state.contentStream, fittedText, currentX + CELL_PADDING, y - 12f, font, fontSize);
            currentX += colWidth;
        }
    }

    private void drawHorizontalLine(PageState state, float startX, float endX) throws IOException {
        state.contentStream.moveTo(startX, state.y);
        state.contentStream.lineTo(endX, state.y);
        state.contentStream.stroke();
    }

    private void drawThickHorizontalLine(PageState state, float startX, float endX) throws IOException {
        state.contentStream.setLineWidth(1.5f);
        state.contentStream.moveTo(startX, state.y);
        state.contentStream.lineTo(endX, state.y);
        state.contentStream.stroke();
        state.contentStream.setLineWidth(1f);
    }

    private void drawDashedLine(PageState state, float startX, float endX) throws IOException {
        state.contentStream.setLineDashPattern(new float[]{3, 3}, 0);
        state.contentStream.moveTo(startX, state.y);
        state.contentStream.lineTo(endX, state.y);
        state.contentStream.stroke();
        state.contentStream.setLineDashPattern(new float[]{}, 0);
    }

    private PageState startPage(PDDocument document, PDFont headerFont, PDFont bodyFont, PDFont italicFont) throws IOException {
        PDPage page = new PDPage(PDRectangle.LETTER);
        document.addPage(page);
        PDPageContentStream contentStream = new PDPageContentStream(document, page);
        float y = page.getMediaBox().getHeight() - MARGIN;
        return new PageState(page, contentStream, y, headerFont, bodyFont, italicFont);
    }

    private PageState ensureSpace(PDDocument document, PageState state, float requiredHeight) throws IOException {
        if (state.y - requiredHeight < MARGIN) {
            state.contentStream.close();
            return startPage(document, state.headerFont, state.bodyFont, state.italicFont);
        }
        return state;
    }

    private PDFont loadFont(PDDocument document, String[] paths, PDFont fallback) {
        for (String path : paths) {
            File file = new File(path);
            if (file.exists()) {
                try {
                    return PDType0Font.load(document, file);
                } catch (IOException ignored) {}
            }
        }
        return fallback;
    }

    private PageState writeBodyLine(PDDocument document, PageState state, String text) throws IOException {
        state = ensureSpace(document, state, LINE_HEIGHT);
        writeText(state.contentStream, text, MARGIN, state.y, state.bodyFont, BODY_FONT_SIZE);
        state.y -= LINE_HEIGHT;
        return state;
    }

    private void writeText(PDPageContentStream contentStream, String text,
                           float x, float y, PDFont font, float fontSize) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(text == null ? "" : text);
        contentStream.endText();
    }

    private String fitToWidth(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
        if (text == null || text.isEmpty()) return "";
        float textWidth = font.getStringWidth(text) / 1000f * fontSize;
        if (textWidth <= maxWidth) return text;
        String ellipsis = "...";
        int end = text.length();
        while (end > 0) {
            String truncated = text.substring(0, end) + ellipsis;
            if (font.getStringWidth(truncated) / 1000f * fontSize <= maxWidth) return truncated;
            end--;
        }
        return "";
    }

    private String resolveTitle(ReportMetadata metadata) {
        if (metadata == null) return "Transaction Report";
        if (metadata.getTitle() != null && !metadata.getTitle().isBlank()) return metadata.getTitle();
        if (metadata.getReportType() != null) return metadata.getReportType().name();
        return "Transaction Report";
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) return "-";
        return "₱" + String.format("%,.2f", value);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "N/A";
        return dateTime.format(DATE_TIME_FMT);
    }

    private String formatDateRange(LocalDate minDate, LocalDate maxDate) {
        if (minDate == null && maxDate == null) return null;
        String from = minDate != null ? minDate.format(DATE_FMT) : "Beginning";
        String to = maxDate != null ? maxDate.format(DATE_FMT) : "Present";
        return from + " to " + to;
    }

    private String formatDiscount(TransactionItemEntry item) {
        if (item.getDiscountType() == null || item.getDiscountValue() == null) return "-";
        return switch (item.getDiscountType()) {
            case PERCENT -> item.getDiscountValue().toPlainString() + "%";
            case FIXED -> formatCurrency(item.getDiscountValue());
        };
    }

    private String formatUuid(java.util.UUID uuid) {
        return uuid == null ? "N/A" : uuid.toString();
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String safeInt(Integer value) {
        return value == null ? "-" : value.toString();
    }

    private static class PageState {
        private final PDPage page;
        private final PDPageContentStream contentStream;
        private float y;
        private final PDFont headerFont;
        private final PDFont bodyFont;
        private final PDFont italicFont;

        private PageState(PDPage page, PDPageContentStream contentStream, float y,
                          PDFont headerFont, PDFont bodyFont, PDFont italicFont) {
            this.page = page;
            this.contentStream = contentStream;
            this.y = y;
            this.headerFont = headerFont;
            this.bodyFont = bodyFont;
            this.italicFont = italicFont;
        }
    }
}
