package com.mmtorresoptical.OpticalClinicManagementSystem.dto.summary;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.InventoryAnalyticsDTO;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SummaryResponseDTO {

    private InventoryAnalyticsDTO inventoryAnalyticsDTO;
}