package com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RescheduleFollowUpRequestDTO {
    @NotNull
    private LocalDate scheduledDate;
}
