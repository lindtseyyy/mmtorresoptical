package com.mmtorresoptical.OpticalClinicManagementSystem.services;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.InventoryValueSnapshot;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.analytics.InventoryAnalyticsRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.InventoryValueSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryValueSnapshotService {

    private final InventoryAnalyticsRepository inventoryAnalyticsRepository;
    private final InventoryValueSnapshotRepository snapshotRepository;

    /**
     * Runs at 00:05 on the 1st of each month.
     * Saves the prior month's ending inventory value.
     */
    @Scheduled(cron = "0 5 0 1 * ?")
    public void captureMonthEndSnapshot() {
        captureSnapshotForMonth(YearMonth.now().minusMonths(1));
    }

    /**
     * Saves a snapshot for the last day of the given month.
     * Does nothing if a snapshot for that month already exists.
     */
    public InventoryValueSnapshot captureSnapshotForMonth(YearMonth yearMonth) {
        LocalDate snapshotDate = yearMonth.atEndOfMonth();

        boolean exists = snapshotRepository
                .findBySnapshotDateBetweenOrderBySnapshotDateAsc(snapshotDate, snapshotDate)
                .stream()
                .anyMatch(s -> s.getSnapshotDate().equals(snapshotDate));

        if (exists) {
            log.info("Snapshot for {} already exists — skipping.", snapshotDate);
            return null;
        }

        BigDecimal value = inventoryAnalyticsRepository.inventoryValue();

        InventoryValueSnapshot snapshot = new InventoryValueSnapshot();
        snapshot.setSnapshotDate(snapshotDate);
        snapshot.setTotalValue(value);
        snapshotRepository.save(snapshot);

        log.info("Saved inventory value snapshot for {}: {}", snapshotDate, value);
        return snapshot;
    }
}
