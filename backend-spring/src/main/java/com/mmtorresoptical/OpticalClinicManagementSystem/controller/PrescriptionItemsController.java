package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PrescriptionItemsController {
    private final PrescriptionService prescriptionService;

    @PostMapping("/api/admin/prescriptions/{id}/prescription-items")
    public ResponseEntity<List<PrescriptionItemDetailsDTO>> addPrescriptionItems(@PathVariable UUID id, @Valid @RequestBody List<CreatePrescriptionItemRequestDTO> createPrescriptionRequestDTOList) {
        List<PrescriptionItemDetailsDTO> response = prescriptionService.addItems(id, createPrescriptionRequestDTOList);

        return ResponseEntity.ok(response);
    }
}
