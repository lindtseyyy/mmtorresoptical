package com.mmtorresoptical.OpticalClinicManagementSystem.controller.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.CategoryBreakdownDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryAnalyticsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryValueTrendPoint;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.ProductMetricsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports/inventory")
public class InventoryReportController {

    private final InventoryAnalyticsService inventoryAnalyticsService;

    @GetMapping("/summary")
    public InventoryAnalyticsDTO getInventorySummary() {
        return inventoryAnalyticsService.getInventoryAnalytics();
    }

    @GetMapping("/lowstock-products")
    public Page<ProductDetailsDTO> getLowStockProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "productName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder,
            Sort sort) {

        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");
        if (!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        return inventoryAnalyticsService.getLowStockProducts(page, size, sortBy, sortOrder);
    }

    @GetMapping("/overstocked-products")
    public Page<ProductDetailsDTO> getOverStockedProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "productName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder,
            Sort sort) {

        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");
        if (!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        return inventoryAnalyticsService.getOverStockedProducts(page, size, sortBy, sortOrder);
    }

    @GetMapping("/outofstock-products")
    public Page<ProductDetailsDTO> getOutOfStockProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "productName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder,
            Sort sort) {

        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");
        if (!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        return inventoryAnalyticsService.getOutOfStockProducts(page, size, sortBy, sortOrder);
    }

    @GetMapping("/product/{productId}/metrics")
    public ProductMetricsDTO getProductMetrics(@PathVariable UUID productId) {
        return inventoryAnalyticsService.getProductMetrics(productId);
    }

    @GetMapping("/topselling-products")
    public List<TopSellingProductDTO> getTopSellingProducts(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "productName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder,
            Sort sort) {

        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");
        if (!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        return inventoryAnalyticsService.getTopSellingProducts(startDate, endDate, page, size, sortBy, sortOrder);
    }

    @GetMapping("/category-breakdown")
    public List<CategoryBreakdownDTO> getCategoryBreakdown() {
        return inventoryAnalyticsService.getCategoryBreakdown();
    }

    @GetMapping("/value-trend")
    public List<InventoryValueTrendPoint> getInventoryValueTrend() {
        return inventoryAnalyticsService.getInventoryValueTrend();
    }
}
