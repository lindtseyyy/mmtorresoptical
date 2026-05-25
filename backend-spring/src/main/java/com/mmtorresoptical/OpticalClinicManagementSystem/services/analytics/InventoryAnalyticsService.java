package com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.CategoryBreakdownDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryAnalyticsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryValueTrendPoint;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.ProductMetricsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.ProductMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.InventoryValueSnapshot;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.InventoryValueSnapshotRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.analytics.InventoryAnalyticsRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
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
    private final ProductRepository productRepository;

    public InventoryAnalyticsDTO getInventoryAnalytics() {
        long totalProducts = inventoryAnalyticsRepository.countActiveProducts();
        long totalStockQuantity = inventoryAnalyticsRepository.totalStockQuantity();
        BigDecimal inventoryValue = inventoryAnalyticsRepository.inventoryValue();
        long countLowStockProducts = inventoryAnalyticsRepository.countLowStockProducts();
        long countOverStockedProducts = inventoryAnalyticsRepository.countOverstockedProducts();
        long countReorderNeededProducts = getReorderNeededCount();
        long countOutOfStockProducts = inventoryAnalyticsRepository.countOutOfStockProducts();
        long countArchivedProducts = inventoryAnalyticsRepository.countArchivedProducts();
        BigDecimal archivedInventoryValue = inventoryAnalyticsRepository.archivedInventoryValue();
        long countArchivedWithStock = inventoryAnalyticsRepository.countArchivedWithStock();

        return InventoryAnalyticsDTO.builder()
                .totalProducts(totalProducts)
                .totalStockQuantity(totalStockQuantity)
                .inventoryValue(inventoryValue)
                .countLowStockProducts(countLowStockProducts)
                .countOverstockedProducts(countOverStockedProducts)
                .countReorderNeededProducts(countReorderNeededProducts)
                .countOutOfStockProducts(countOutOfStockProducts)
                .countArchivedProducts(countArchivedProducts)
                .archivedInventoryValue(archivedInventoryValue)
                .countArchivedWithStock(countArchivedWithStock)
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

    public Page<ProductDetailsDTO> getOutOfStockProducts(int page,
                                                       int size,
                                                       String sortBy,
                                                       String sortOrder) {

        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            direction = Sort.Direction.DESC;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Product> products = inventoryAnalyticsRepository.findOutOfStockProducts(pageable);

        return products.map(productMapper::entityToDetailsDTO);
    }

    public List<ProductDetailsDTO> getAllOutOfStockProducts() {
        Sort sort = Sort.by(Sort.Direction.ASC, "productName");
        List<Product> products = inventoryAnalyticsRepository.findOutOfStockProducts(sort);

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
     * (inventoryValue() query). Months without a snapshot carry forward the
     * nearest known value so the trend always spans a full 12 months.
     */
    public List<InventoryValueTrendPoint> getInventoryValueTrend() {
        YearMonth currentMonth = YearMonth.now();
        YearMonth twelveMonthsAgo = currentMonth.minusMonths(11);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

        Map<YearMonth, BigDecimal> snapshots = snapshotRepository
                .findBySnapshotDateBetweenOrderBySnapshotDateAsc(
                        twelveMonthsAgo.atDay(1),
                        currentMonth.atEndOfMonth())
                .stream()
                .collect(Collectors.toMap(
                        s -> YearMonth.from(s.getSnapshotDate()),
                        InventoryValueSnapshot::getTotalValue));

        BigDecimal liveValue = inventoryAnalyticsRepository.inventoryValue();

        List<InventoryValueTrendPoint> trend = new ArrayList<>();

        for (int i = 0; i <= 11; i++) {
            YearMonth m = currentMonth.minusMonths(i);
            BigDecimal value;

            if (i == 0) {
                value = liveValue;
            } else {
                value = snapshots.getOrDefault(m, BigDecimal.ZERO);
            }

            trend.add(InventoryValueTrendPoint.builder()
                    .month(m.format(fmt))
                    .value(value)
                    .build());
        }

        Collections.reverse(trend);
        return trend;
    }

    // ── Reorder Point (ROP) Engine ──────────────────────────────────

    /**
     * Builds a map of productId → total net units sold over the past 30 days
     * from PAID/DEPOSIT transactions (net of refunded quantities).
     */
    private Map<UUID, Long> fetchSalesVelocityMap() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return inventoryAnalyticsRepository.sumUnitsSoldPerProductSince(thirtyDaysAgo)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));
    }

    /**
     * Daily sales velocity: D = totalSold / 30.0
     */
    private double getDailySalesVelocity(UUID productId, Map<UUID, Long> velocityMap) {
        long totalSold = velocityMap.getOrDefault(productId, 0L);
        return totalSold / 30.0;
    }

    /**
     * ROP = (D × leadTimeDays) + 2 (safety stock buffer).
     * Rounded to nearest integer.
     */
    public int computeReorderPoint(UUID productId, int leadTimeDays, Map<UUID, Long> velocityMap) {
        double dailyVelocity = getDailySalesVelocity(productId, velocityMap);
        return (int) Math.round(dailyVelocity * leadTimeDays) + 2;
    }

    /**
     * Counts active, non-archived PHYSICAL products with quantity > 0
     * whose current stock is <= finalReorderThreshold,
     * where finalReorderThreshold = max(lowLevelThreshold, computed ROP).
     */
    public long getReorderNeededCount() {
        Specification<Product> spec = Specification
                .where(ProductSpecification.hasArchivedStatus("ACTIVE"))
                .and((root, query, cb) -> cb.equal(root.get("productType"), ProductType.PHYSICAL))
                .and((root, query, cb) -> cb.greaterThan(root.get("quantity"), 0));

        List<Product> candidates = productRepository.findAll(spec);
        if (candidates.isEmpty()) return 0;

        Map<UUID, Long> velocityMap = fetchSalesVelocityMap();

        return candidates.stream()
                .filter(p -> {
                    int rop = computeReorderPoint(
                            p.getProductId(),
                            p.getLeadTimeDays() != null ? p.getLeadTimeDays() : 3,
                            velocityMap
                    );
                    int threshold = Math.max(
                            p.getLowLevelThreshold() != null ? p.getLowLevelThreshold() : 0,
                            rop
                    );
                    return p.getQuantity() <= threshold;
                })
                .count();
    }

    /**
     * Enriches a list of ProductDetailsDTOs with computed reorderPoint values.
     * Uses hybrid safety override: finalReorderThreshold = max(lowLevelThreshold, ROP).
     * Called by ProductService after fetching product pages.
     * SERVICE products get reorderPoint = null.
     */
    public void enrichWithReorderPoints(List<ProductDetailsDTO> dtos) {
        if (dtos.isEmpty()) return;

        Map<UUID, Long> velocityMap = fetchSalesVelocityMap();

        for (ProductDetailsDTO dto : dtos) {
            if ("SERVICE".equals(dto.getProductType())) {
                dto.setReorderPoint(null);
                dto.setSuggestedOrderQuantity(null);
                continue;
            }
            int leadTime = dto.getLeadTimeDays() != null ? dto.getLeadTimeDays() : 3;
            int rop = computeReorderPoint(dto.getProductId(), leadTime, velocityMap);
            int lowThreshold = dto.getLowLevelThreshold() != null ? dto.getLowLevelThreshold() : 0;
            dto.setReorderPoint(Math.max(lowThreshold, rop));

            // Days-of-supply order quantity: 30-day target, floor = lowLevelThreshold
            double dailyVelocity = getDailySalesVelocity(dto.getProductId(), velocityMap);
            int calculatedTargetStock = (int) Math.ceil(dailyVelocity * 30);
            int finalTargetStock = Math.max(calculatedTargetStock, lowThreshold);
            int orderQty = finalTargetStock - dto.getQuantity();
            dto.setSuggestedOrderQuantity(Math.max(orderQty, 0));
        }
    }

}
