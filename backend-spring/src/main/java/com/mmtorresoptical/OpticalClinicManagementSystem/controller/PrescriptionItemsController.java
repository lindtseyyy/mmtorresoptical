package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.UpdatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.PrescriptionItemsService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PrescriptionItemsController {
    private final PrescriptionService prescriptionService;
    private final PrescriptionItemsService prescriptionItemsService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/prescriptions/{id}/prescription-items")
    public ResponseEntity<List<PrescriptionItemDetailsDTO>> addPrescriptionItems(@PathVariable UUID id, @Valid @RequestBody List<CreatePrescriptionItemRequestDTO> createPrescriptionRequestDTOList) {
        List<PrescriptionItemDetailsDTO> response = prescriptionService.addItems(id, createPrescriptionRequestDTOList);

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/prescriptions/{id}/prescription-items")
    public ResponseEntity<Page<PrescriptionItemDetailsDTO>> getAllPrescriptionItems(@PathVariable UUID id,
                                                                                 @RequestParam(defaultValue = "0") int page,
                                                                                 @RequestParam(defaultValue = "10") int size,
                                                                                 @RequestParam(defaultValue = "createdAt") String sortBy,
                                                                                 @RequestParam(defaultValue = "ascending") String sortOrder,
                                                                                 @RequestParam(defaultValue = "ACTIVE") String archivedStatus) {


        Page<PrescriptionItemDetailsDTO> prescriptionItemDetailsDTOPage = prescriptionItemsService.getAllPrescriptionItems(id, page, size, sortBy, sortOrder, archivedStatus);

        return ResponseEntity.ok(prescriptionItemDetailsDTOPage);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/prescription-items/{id}")
    public ResponseEntity<PrescriptionItemDetailsDTO> getPrescriptionItem(@PathVariable UUID id) {

        PrescriptionItemDetailsDTO prescriptionItemDetailsDTO = prescriptionItemsService.getPrescription(id);

        return ResponseEntity.ok(prescriptionItemDetailsDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/prescription-items/{id}")
    public ResponseEntity<PrescriptionItemDetailsDTO> updatePrescriptionItem(@PathVariable UUID id,
                                                                             @Valid @RequestBody UpdatePrescriptionItemRequestDTO updatePrescriptionItemRequestDTO) {

        PrescriptionItemDetailsDTO prescriptionItemDetailsDTO = prescriptionItemsService.updatePrescription(id, updatePrescriptionItemRequestDTO);

        return ResponseEntity.ok(prescriptionItemDetailsDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/prescription-items/{id}")
    public ResponseEntity<Void> archivePrescriptionItem(@PathVariable UUID id) {

        prescriptionItemsService.archivePrescriptionItem(id);

        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/prescription-items/{id}/restore")
    public ResponseEntity<Void> restorePrescriptionItem(@PathVariable UUID id) {

        prescriptionItemsService.restorePrescriptionItem(id);

        return ResponseEntity.noContent().build();
    }

}

