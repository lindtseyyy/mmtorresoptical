package com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateFollowUpStatusRequestDTO {
    @NotNull
    private String status;
}
