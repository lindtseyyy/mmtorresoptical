package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.summary.SummaryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.DateRange;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.dashboard.SummaryService;
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
@RequestMapping("/api/summary")
public class SummaryController {

    private final SummaryService summaryService;
    private final InventoryAnalyticsService inventoryAnalyticsService;

    @GetMapping
    public SummaryResponseDTO getSummary(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {

        if (startDate == null || endDate == null) {
            startDate = LocalDate.now();
            endDate = LocalDate.now();
        }

        DateRange range = new DateRange(startDate, endDate);

        return summaryService.getSummary(range);
    }

    @GetMapping("/inventory/lowstock-products")
    public Page<ProductDetailsDTO> getLowStockProducts(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size,
                                                       @RequestParam(defaultValue = "productName") String sortBy,
                                                       @RequestParam(defaultValue = "asc") String sortOrder, Sort sort) {

        // Validation for sortBy column
        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");

        if(!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        return inventoryAnalyticsService.getLowStockProducts(page, size, sortBy, sortOrder);
    }

    @GetMapping("/inventory/overstocked-products")
    public Page<ProductDetailsDTO> getOverStockedProducts(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size,
                                                       @RequestParam(defaultValue = "productName") String sortBy,
                                                       @RequestParam(defaultValue = "asc") String sortOrder, Sort sort) {

        // Validation for sortBy column
        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");

        if(!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        return inventoryAnalyticsService.getOverStockedProducts(page, size, sortBy, sortOrder);
    }

    @GetMapping("/inventory/topselling-products")
    public List<TopSellingProductDTO> getTopSellingProducts(@RequestParam(required = false) LocalDate startDate,
                                                            @RequestParam(required = false) LocalDate endDate,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size,
                                                            @RequestParam(defaultValue = "productName") String sortBy,
                                                            @RequestParam(defaultValue = "asc") String sortOrder, Sort sort) {

        // Validation for sortBy column
        List<String> allowedSortByValues = List.of("productName", "quantity", "unitPrice");

        if(!allowedSortByValues.contains(sortBy)) {
            sortBy = "productName";
        }

        return inventoryAnalyticsService.getTopSellingProducts(startDate, endDate, page, size, sortBy, sortOrder);
    }

}