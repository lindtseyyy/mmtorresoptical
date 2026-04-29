package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.summary.SummaryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.DateRange;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.dashboard.SummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/summary")
public class SummaryController {

    private final SummaryService summaryService;

    @GetMapping
    public SummaryResponseDTO getSummary(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        if (startDate == null || endDate == null) {
            startDate = LocalDate.now();
            endDate = LocalDate.now();
        }

        DateRange range = new DateRange(startDate, endDate);

        return summaryService.getSummary(range);
    }
}
