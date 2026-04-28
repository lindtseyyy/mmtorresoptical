package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportAggregationService {

    private final InventoryAnalyticsService inventoryAnalyticsService;
    private final TransactionService transactionService;

    public TabularReportDataset buildReport(ReportType reportType, LocalDate minDate, LocalDate maxDate) {
        ReportMetadata metadata = ReportMetadata.builder()
                .generatedAt(Instant.now())
                .generatedBy(resolveGeneratedBy())
                .reportType(reportType)
                .title(reportType != null ? reportType.getDisplayTitle() : "UNKNOWN")
                .build();

        if (reportType == null) {
            return TabularReportDataset.empty(metadata);
        }

        return switch (reportType) {
            case INVENTORY_LOW_STOCK -> buildInventoryLowStockReport(metadata);
            case INVENTORY_OVERSTOCK -> buildInventoryOverstockReport(metadata);
            case INVENTORY_TOP_SELLING -> buildInventoryTopSellingReport(metadata);
            case TRANSACTIONS -> buildTransactionsReport(metadata, minDate, maxDate);
            default -> TabularReportDataset.empty(metadata);
        };
    }

    public ComprehensiveInventoryReportDataset buildInventoryAnalyticsReport() {
        int topN = 10;
        ReportMetadata metadata = ReportMetadata.builder()
                .generatedAt(Instant.now())
                .generatedBy(resolveGeneratedBy())
                .reportType(ReportType.INVENTORY_ANALYTICS)
                .title("Comprehensive Inventory Analytics Report")
                .build();

        var analytics = inventoryAnalyticsService.getInventoryAnalytics();
        return ComprehensiveInventoryReportDataset.builder()
                .metadata(metadata)
                .totalInventoryValue(analytics.getInventoryValue())
                .totalLowStockCount(analytics.getCountLowStockProducts())
                .totalOverstockCount(analytics.getCountOverstockedProducts())
                .lowStockProducts(inventoryAnalyticsService.getAllLowStockProducts())
                .overstockProducts(inventoryAnalyticsService.getAllOverStockedProducts())
                .topSellingProducts(inventoryAnalyticsService.getTopSellingProductsAllTimeTopN(topN))
                .build();
    }

    private TabularReportDataset buildInventoryLowStockReport(ReportMetadata metadata) {
        List<ProductDetailsDTO> products = inventoryAnalyticsService.getAllLowStockProducts();
        List<String> columns = List.of(
                "Product Name",
                "Category",
                "Supplier",
                "Unit Price",
                "Quantity",
                "Low Stock Threshold"
        );

        List<List<Object>> rows = products.stream()
            .map(product -> Arrays.<Object>asList(
                product.getProductName(),
                product.getCategory(),
                product.getSupplier(),
                product.getUnitPrice(),
                product.getQuantity(),
                product.getLowLevelThreshold()
            ))
            .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private TabularReportDataset buildInventoryOverstockReport(ReportMetadata metadata) {
        List<ProductDetailsDTO> products = inventoryAnalyticsService.getAllOverStockedProducts();
        List<String> columns = Arrays.asList(
                "Product Name",
                "Category",
                "Supplier",
                "Unit Price",
                "Quantity",
                "Overstock Threshold"
        );

        List<List<Object>> rows = products.stream()
            .map(product -> Arrays.<Object>asList(
                product.getProductName(),
                product.getCategory(),
                product.getSupplier(),
                product.getUnitPrice(),
                product.getQuantity(),
                product.getOverstockedThreshold()
            ))
            .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private TabularReportDataset buildInventoryTopSellingReport(ReportMetadata metadata) {
        List<TopSellingProductDTO> products = inventoryAnalyticsService.getAllTopSellingProducts(null, null);
        List<String> columns = Arrays.asList(
                "Product Name",
                "Category",
                "Total Quantity Sold",
                "Total Revenue"
        );

        List<List<Object>> rows = products.stream()
            .map(product -> Arrays.<Object>asList(
                product.productName(),
                product.category(),
                product.totalSold(),
                product.totalRevenue()
            ))
            .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private TabularReportDataset buildTransactionsReport(
            ReportMetadata metadata,
            LocalDate minDate,
            LocalDate maxDate
    ) {
        List<Transaction> transactions = transactionService.getTransactionsForReport(minDate, maxDate);

        if (transactions.isEmpty()) {
            return TabularReportDataset.empty(metadata, "No transactions available.");
        }

        List<String> columns = Arrays.asList(
                "Transaction ID",
                "Transaction Date",
                "Total Amount",
                "Payment Type",
                "Status",
                "Reference No"
        );

        List<List<Object>> rows = transactions.stream()
                .map(transaction -> Arrays.<Object>asList(
                        transaction.getTransactionId(),
                        transaction.getTransactionDate(),
                        transaction.getTotalAmount(),
                        transaction.getPaymentType(),
                        transaction.getTransactionStatus(),
                        transaction.getReferenceNumber()
                ))
                .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private String resolveGeneratedBy() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "System";
        }

        String username = auth.getName();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority())
                .orElse("UNKNOWN");

        if (role.startsWith("ROLE_")) {
            role = role.substring("ROLE_".length());
        }

        if (username == null || username.isBlank()) {
            username = "System";
        }

        return username + " (" + role + ")";
    }
}
