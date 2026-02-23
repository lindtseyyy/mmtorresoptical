package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;

import lombok.Data;

import java.util.List;

@Data
public class RefundTransactionRequestDTO {

    private List<RefundItemDTO> items;

}