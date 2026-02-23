package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VoidTransactionRequestDTO {

    @NotBlank
    private String reason;
}
