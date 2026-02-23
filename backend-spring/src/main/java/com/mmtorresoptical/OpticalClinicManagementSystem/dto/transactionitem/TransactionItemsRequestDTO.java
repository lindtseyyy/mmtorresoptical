package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.DiscountType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransactionItemsRequestDTO {

    @NotNull
    private UUID productId;

    @NotNull
    @Min(1)
    private Integer quantity;

    private DiscountType discountType;

    private BigDecimal discountValue;

    private Boolean isRefunded = false;

    private Boolean isDiscounted = false;

}
