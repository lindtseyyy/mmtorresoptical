package com.mmtorresoptical.OpticalClinicManagementSystem.services.dashboard;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryAnalyticsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.summary.SummaryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.DateRange;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SummaryService {

    private final InventoryAnalyticsService inventoryAnalyticsService;

    public SummaryResponseDTO getSummary(DateRange range) {


        InventoryAnalyticsDTO inventoryAnalyticsDTO = inventoryAnalyticsService.getInventoryAnalytics();

        return SummaryResponseDTO.builder()
                .inventoryAnalyticsDTO(inventoryAnalyticsDTO)
                .build();
    }

}