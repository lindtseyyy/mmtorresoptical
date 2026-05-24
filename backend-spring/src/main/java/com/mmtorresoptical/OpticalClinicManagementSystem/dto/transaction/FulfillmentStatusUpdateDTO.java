package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FulfillmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FulfillmentStatusUpdateDTO {

    @NotNull
    private FulfillmentStatus fulfillmentStatus;
}
