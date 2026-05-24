package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/patient/{id}/prescriptions")
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(@PathVariable UUID id, @Valid @RequestBody CreatePrescriptionRequestDTO prescriptionRequest) {
        PrescriptionResponseDTO prescriptionResponseDTO = prescriptionService.createPrescription(id, prescriptionRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(prescriptionResponseDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/patient/{id}/prescriptions")
    public ResponseEntity<Page<PrescriptionListDTO>> getAllPatientPrescriptions(@PathVariable UUID id,
                                                                                @RequestParam(required = false) String keyword,
                                                                              @RequestParam(required = false) LocalDate minDate,
                                                                                @RequestParam(required = false) LocalDate maxDate,
                                                                                @RequestParam(defaultValue = "0") int page,
                                                                              @RequestParam(defaultValue = "10") int size,
                                                                              @RequestParam(defaultValue = "issueDate") String sortBy,
                                                                              @RequestParam(defaultValue = "desc") String sortOrder,
                                                                              @RequestParam(defaultValue = "ACTIVE") String status) {
        Page<PrescriptionListDTO> prescriptionListDTOPage = prescriptionService.getAllPatientPrescriptions(id, keyword, minDate, maxDate, page, size, sortBy, sortOrder, status);
        return ResponseEntity.ok(prescriptionListDTOPage);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @GetMapping("/api/patient/{patientId}/prescriptions")
    public ResponseEntity<Page<PrescriptionListDTO>> getPatientPrescriptionsForCheckout(
            @PathVariable UUID patientId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) LocalDate minDate,
            @RequestParam(required = false) LocalDate maxDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(defaultValue = "ACTIVE") String status) {
        Page<PrescriptionListDTO> prescriptionListDTOPage = prescriptionService.getAllPatientPrescriptions(
                patientId, keyword, minDate, maxDate, page, size, sortBy, sortOrder, status);
        return ResponseEntity.ok(prescriptionListDTOPage);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailsDTO> getPrescriptionAdmin(@PathVariable UUID id) {
        PrescriptionDetailsDTO prescriptionDetailsDTO = prescriptionService.getPrescription(id);
        return ResponseEntity.ok(prescriptionDetailsDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailsDTO> getPrescription(@PathVariable UUID id) {
        PrescriptionDetailsDTO prescriptionDetailsDTO = prescriptionService.getPrescription(id);
        return ResponseEntity.ok(prescriptionDetailsDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailsDTO> updatePrescription(@PathVariable UUID id,
                                                                     @Valid @RequestBody UpdatePrescriptionRequestDTO request) {
        PrescriptionDetailsDTO prescriptionDetailsDTO = prescriptionService.updatePrescription(id, request);
        return ResponseEntity.ok(prescriptionDetailsDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<Void> archivePrescription(@PathVariable UUID id) {
        prescriptionService.archivePrescription(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/prescriptions/{id}/restore")
    public ResponseEntity<Void> restorePrescription(@PathVariable UUID id) {
        prescriptionService.restorePrescription(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/prescriptions/{id}/void")
    public ResponseEntity<Void> voidPrescription(@PathVariable UUID id,
                                                  @Valid @RequestBody VoidPrescriptionRequestDTO request) {
        prescriptionService.voidPrescription(id, request);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/prescriptions/{id}/clone")
    public ResponseEntity<PrescriptionResponseDTO> clonePrescription(@PathVariable UUID id) {
        PrescriptionResponseDTO response = prescriptionService.clonePrescription(id);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PutMapping("/api/prescriptions/{id}/sync")
    public ResponseEntity<Void> syncBlocks(
            @PathVariable UUID id,
            @Valid @RequestBody PrescriptionRecommendationsDTO dto) {
        prescriptionService.syncPrescriptionBlocks(id, dto);
        return ResponseEntity.ok().build();
    }
}
