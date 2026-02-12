package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.HealthHistoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/healthhistory")
public class HealthHistoryController {

    private final HealthHistoryRepository healthHistoryRepository;

    HealthHistoryController(HealthHistoryRepository healthHistoryRepository) {
        this.healthHistoryRepository = healthHistoryRepository;
    }

}
