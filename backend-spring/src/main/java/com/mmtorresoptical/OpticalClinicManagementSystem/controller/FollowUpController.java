package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.PatientFollowUpDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.RescheduleFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.UpdateFollowUpStatusRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.PatientFollowUpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/follow-ups")
public class FollowUpController {

    private final PatientFollowUpService patientFollowUpService;

    @GetMapping("/prescription/{prescriptionId}")
    public ResponseEntity<List<PatientFollowUpDTO>> getByPrescription(@PathVariable UUID prescriptionId) {
        return ResponseEntity.ok(patientFollowUpService.getFollowUpsByPrescription(prescriptionId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PatientFollowUpDTO>> getByPatient(@PathVariable UUID patientId,
                                                                  @RequestParam(required = false) String status) {
        return ResponseEntity.ok(patientFollowUpService.getFollowUpsByPatient(patientId, status));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PatientFollowUpDTO> updateStatus(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateFollowUpStatusRequestDTO request) {
        return ResponseEntity.ok(patientFollowUpService.updateStatus(id, request));
    }

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<PatientFollowUpDTO> reschedule(@PathVariable UUID id,
                                                          @Valid @RequestBody RescheduleFollowUpRequestDTO request) {
        return ResponseEntity.ok(patientFollowUpService.reschedule(id, request));
    }
}
