package com.mmtorresoptical.OpticalClinicManagementSystem.objects;

import java.math.BigDecimal;
import java.util.UUID;


public record TopSellingProductDTO (UUID productId,
                                    String productName,
                                    BigDecimal unitPrice,
                                    Long totalSold,
                                    BigDecimal totalRevenue) {
}