package com.mmtorresoptical.OpticalClinicManagementSystem.dto.supplier;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierWithProductCountDTO {
    private UUID supplierId;
    private String name;
    private Boolean isActive;
    private Long productCount;
}
