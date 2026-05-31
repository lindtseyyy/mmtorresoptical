package com.mmtorresoptical.OpticalClinicManagementSystem.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryWithProductCountDTO {
    private UUID categoryId;
    private String name;
    private Boolean isActive;
    private Long productCount;
}
