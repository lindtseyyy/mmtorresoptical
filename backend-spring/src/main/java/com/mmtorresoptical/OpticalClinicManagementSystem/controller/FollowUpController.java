package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.CreateFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.PatientFollowUpDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.RescheduleFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.UpdateFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.UpdateFollowUpStatusRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.PatientFollowUpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/follow-ups")
public class FollowUpController {

    private final PatientFollowUpService patientFollowUpService;

    @PostMapping
    public ResponseEntity<PatientFollowUpDTO> createFollowUp(@Valid @RequestBody CreateFollowUpRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientFollowUpService.createFollowUp(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientFollowUpDTO> updateFollowUp(@PathVariable UUID id,
                                                               @Valid @RequestBody UpdateFollowUpRequestDTO request) {
        return ResponseEntity.ok(patientFollowUpService.updateFollowUp(id, request));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<Void> archiveFollowUp(@PathVariable UUID id) {
        patientFollowUpService.archiveFollowUp(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Void> restoreFollowUp(@PathVariable UUID id) {
        patientFollowUpService.restoreFollowUp(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/prescription/{prescriptionId}")
    public ResponseEntity<List<PatientFollowUpDTO>> getByPrescription(@PathVariable UUID prescriptionId) {
        return ResponseEntity.ok(patientFollowUpService.getFollowUpsByPrescription(prescriptionId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PatientFollowUpDTO>> getByPatient(@PathVariable UUID patientId,
                                                                  @RequestParam(required = false) String status,
                                                                  @RequestParam(defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(patientFollowUpService.getFollowUpsByPatient(patientId, status, includeArchived));
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
