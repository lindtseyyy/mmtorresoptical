package com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryAnalyticsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.ProductMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.analytics.InventoryAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryAnalyticsService {

    private final InventoryAnalyticsRepository inventoryAnalyticsRepository;
    private final ProductMapper productMapper;

    public InventoryAnalyticsDTO getInventoryAnalytics() {
        BigDecimal inventoryValue = inventoryAnalyticsRepository.inventoryValue();
        long countLowStockProducts = inventoryAnalyticsRepository.countLowStockProducts();
        long countOverStockedProducts = inventoryAnalyticsRepository.countOverstockedProducts();

        return InventoryAnalyticsDTO.builder()
                .inventoryValue(inventoryValue)
                .countLowStockProducts(countLowStockProducts)
                .countOverstockedProducts(countOverStockedProducts)
                .build();
    }

    public Page<ProductDetailsDTO> getLowStockProducts(int page,
                                                       int size,
                                                       String sortBy,
                                                       String sortOrder) {

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Product> products = inventoryAnalyticsRepository.findLowStockProducts(pageable);

        return products.map(productMapper::entityToDetailsDTO);
    }

    public Page<ProductDetailsDTO> getOverStockedProducts(int page,
                                                       int size,
                                                       String sortBy,
                                                       String sortOrder) {

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Product> products = inventoryAnalyticsRepository.findOverstockedProducts(pageable);

        return products.map(productMapper::entityToDetailsDTO);
    }

    public List<TopSellingProductDTO> getTopSellingProducts(LocalDate startDate,
                                                            LocalDate endDate,
                                                            int page,
                                                            int size,
                                                            String sortBy,
                                                            String sortOrder) {

        LocalDateTime startDateTime = null;
        LocalDateTime  endDateTime = null;

        if(startDate != null) {
            startDateTime = startDate.atStartOfDay();
        }

        if(endDate != null) {
            endDateTime = endDate.plusDays(1).atStartOfDay();
        }

        // Default to full range instead of null
        if (startDate == null) {
            startDateTime = LocalDate.of(1970, 1, 1).atStartOfDay();
        }

        if (endDate == null) {
            endDateTime = LocalDate.now().plusDays(1).atStartOfDay();
        }

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size);

        return inventoryAnalyticsRepository.findTopSellingProducts(startDateTime,endDateTime, pageable);
    }

}
