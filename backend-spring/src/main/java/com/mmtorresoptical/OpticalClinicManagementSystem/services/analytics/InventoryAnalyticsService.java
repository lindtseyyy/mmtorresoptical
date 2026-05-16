package com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.CategoryBreakdownDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryAnalyticsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryValueTrendPoint;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.ProductMetricsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.ProductMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.InventoryValueSnapshot;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.InventoryValueSnapshotRepository;
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
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryAnalyticsService {

    private final InventoryAnalyticsRepository inventoryAnalyticsRepository;
    private final InventoryValueSnapshotRepository snapshotRepository;
    private final ProductMapper productMapper;

    public InventoryAnalyticsDTO getInventoryAnalytics() {
        long totalProducts = inventoryAnalyticsRepository.countActiveProducts();
        long totalStockQuantity = inventoryAnalyticsRepository.totalStockQuantity();
        BigDecimal inventoryValue = inventoryAnalyticsRepository.inventoryValue();
        long countLowStockProducts = inventoryAnalyticsRepository.countLowStockProducts();
        long countOverStockedProducts = inventoryAnalyticsRepository.countOverstockedProducts();
        long countArchivedProducts = inventoryAnalyticsRepository.countArchivedProducts();

        return InventoryAnalyticsDTO.builder()
                .totalProducts(totalProducts)
                .totalStockQuantity(totalStockQuantity)
                .inventoryValue(inventoryValue)
                .countLowStockProducts(countLowStockProducts)
                .countOverstockedProducts(countOverStockedProducts)
                .countArchivedProducts(countArchivedProducts)
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

    public List<ProductDetailsDTO> getAllLowStockProducts() {
        Sort sort = Sort.by(Sort.Direction.ASC, "quantity");
        List<Product> products = inventoryAnalyticsRepository.findLowStockProducts(sort);

        return products.stream()
                .map(productMapper::entityToDetailsDTO)
                .toList();
    }

    public List<ProductDetailsDTO> getAllOverStockedProducts() {
        Sort sort = Sort.by(Sort.Direction.DESC, "quantity");
        List<Product> products = inventoryAnalyticsRepository.findOverstockedProducts(sort);

        return products.stream()
                .map(productMapper::entityToDetailsDTO)
                .toList();
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

    public List<TopSellingProductDTO> getAllTopSellingProducts(LocalDate startDate,
                                                               LocalDate endDate) {

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

        return inventoryAnalyticsRepository.findTopSellingProducts(startDateTime, endDateTime);
    }

    public List<TopSellingProductDTO> getTopSellingProductsAllTimeTopN(int topN) {
        if (topN <= 0) {
            return List.of();
        }

        Pageable pageable = PageRequest.of(0, topN);
        return inventoryAnalyticsRepository.findTopSellingProducts(
                LocalDate.of(1970, 1, 1).atStartOfDay(),
                LocalDate.now().plusDays(1).atStartOfDay(),
                pageable
        );
    }

    public ProductMetricsDTO getProductMetrics(UUID productId) {
        return Optional.ofNullable(inventoryAnalyticsRepository.findProductMetrics(productId))
                .map(m -> ProductMetricsDTO.builder()
                        .totalUnitsSold(m.getTotalUnitsSold() != null ? m.getTotalUnitsSold() : 0L)
                        .totalRevenue(m.getTotalRevenue() != null ? m.getTotalRevenue() : BigDecimal.ZERO)
                        .numberOfTransactions(m.getNumberOfTransactions() != null ? m.getNumberOfTransactions() : 0L)
                        .lastSoldDate(m.getLastSoldDate())
                        .build())
                .orElse(ProductMetricsDTO.builder()
                        .totalUnitsSold(0L)
                        .totalRevenue(BigDecimal.ZERO)
                        .numberOfTransactions(0L)
                        .lastSoldDate(null)
                        .build());
    }

    public List<CategoryBreakdownDTO> getCategoryBreakdown() {
        return inventoryAnalyticsRepository.findCategoryBreakdown();
    }

    /**
     * Returns monthly inventory values for the last 12 months.
     * Past months use exact snapshots; the current month uses the live value
     * (inventoryValue() query). Months without a snapshot are skipped.
     */
    public List<InventoryValueTrendPoint> getInventoryValueTrend() {
        YearMonth currentMonth = YearMonth.now();
        YearMonth twelveMonthsAgo = currentMonth.minusMonths(11);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

        // Load snapshots for the window
        Map<YearMonth, BigDecimal> snapshots = snapshotRepository
                .findBySnapshotDateBetweenOrderBySnapshotDateAsc(
                        twelveMonthsAgo.atDay(1),
                        currentMonth.atEndOfMonth())
                .stream()
                .collect(Collectors.toMap(
                        s -> YearMonth.from(s.getSnapshotDate()),
                        InventoryValueSnapshot::getTotalValue));

        // Live value for the current month
        BigDecimal liveValue = inventoryAnalyticsRepository.inventoryValue();

        List<InventoryValueTrendPoint> trend = new ArrayList<>();

        for (int i = 11; i >= 0; i--) {
            YearMonth m = currentMonth.minusMonths(i);

            if (m.equals(currentMonth)) {
                trend.add(InventoryValueTrendPoint.builder()
                        .month(m.format(fmt))
                        .value(liveValue)
                        .build());
            } else if (snapshots.containsKey(m)) {
                trend.add(InventoryValueTrendPoint.builder()
                        .month(m.format(fmt))
                        .value(snapshots.get(m))
                        .build());
            }
            // else: no snapshot yet for this month — skip
        }

        return trend;
    }

}
