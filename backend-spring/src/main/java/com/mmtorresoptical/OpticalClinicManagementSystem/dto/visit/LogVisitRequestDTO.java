package com.mmtorresoptical.OpticalClinicManagementSystem.dto.visit;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class LogVisitRequestDTO {
    private LocalDateTime visitTimestamp;
    private String purpose;
    private String notes;
    private UUID followUpId;
}
