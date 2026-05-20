package com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateFollowUpRequestDTO {

    private LocalDate scheduledDate;

    private String followUpReason;
}
