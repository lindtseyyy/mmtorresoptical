package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.visit.LogVisitRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.visit.PatientVisitDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.PatientVisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/patients/{patientId}/visits")
public class PatientVisitController {

    private final PatientVisitService visitService;

    @PostMapping
    public ResponseEntity<PatientVisitDTO> logVisit(
            @PathVariable UUID patientId,
            @Valid @RequestBody LogVisitRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(visitService.logVisit(patientId, request));
    }

    @GetMapping
    public ResponseEntity<List<PatientVisitDTO>> getVisits(@PathVariable UUID patientId) {
        return ResponseEntity.ok(visitService.getVisitsByPatient(patientId));
    }
}
