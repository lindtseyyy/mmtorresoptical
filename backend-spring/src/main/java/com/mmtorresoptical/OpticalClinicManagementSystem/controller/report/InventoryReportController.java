package com.mmtorresoptical.OpticalClinicManagementSystem.controller.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports/inventory")
public class InventoryReportController {

    private final InventoryAnalyticsService inventoryAnalyticsService;

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
}
