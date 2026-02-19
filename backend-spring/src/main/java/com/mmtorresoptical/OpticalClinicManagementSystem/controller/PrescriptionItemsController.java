package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.PrescriptionItemsService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PrescriptionItemsController {
    private final PrescriptionService prescriptionService;
    private final PrescriptionItemsService prescriptionItemsService;

    @PostMapping("/api/admin/prescriptions/{id}/prescription-items")
    public ResponseEntity<List<PrescriptionItemDetailsDTO>> addPrescriptionItems(@PathVariable UUID id, @Valid @RequestBody List<CreatePrescriptionItemRequestDTO> createPrescriptionRequestDTOList) {
        List<PrescriptionItemDetailsDTO> response = prescriptionService.addItems(id, createPrescriptionRequestDTOList);

        return ResponseEntity.ok(response);
    }

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

}

