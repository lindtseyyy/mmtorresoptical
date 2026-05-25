package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final InventoryAnalyticsService inventoryAnalyticsService;

    @GetMapping("/rop-alerts-count")
    public ResponseEntity<Map<String, Long>> getRopAlertsCount() {
        long count = inventoryAnalyticsService.getReorderNeededCount();
        return ResponseEntity.ok(Map.of("count", count));
    }
}
