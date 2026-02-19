package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * Creates a new prescription for a specific patient.
     *
     * This endpoint:
     * - Registers a prescription under the given patient ID
     * - Associates the prescription with the authenticated user
     * - Maps and attaches multiple prescription items
     * - Persists both the prescription and its items using cascade saving
     * - Returns the created prescription with its item details
     *
     * @param id the UUID of the patient receiving the prescription
     * @param prescriptionRequest the request body containing prescription
     *                            details and item entries
     * @return ResponseEntity containing the created PrescriptionResponseDTO
     */
    @PostMapping("/api/admin/patient/{id}/prescriptions")
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(@PathVariable UUID id, @Valid @RequestBody CreatePrescriptionRequestDTO prescriptionRequest) {

        PrescriptionResponseDTO prescriptionResponseDTO = prescriptionService.createPrescription(id, prescriptionRequest);

        return ResponseEntity.ok(prescriptionResponseDTO);
    }

    /**
     * Retrieves all prescriptions for a specific patient.
     *
     * This endpoint:
     * - Fetches prescriptions associated with the given patient ID
     * - Supports filtering by archived status (ACTIVE, ARCHIVED, ALL)
     * - Applies dynamic sorting based on request parameters
     * - Supports pagination for large result sets
     * - Returns summarized prescription information
     *
     * @param id the UUID of the patient whose prescriptions are being retrieved
     * @param page the page number (default = 0)
     * @param size the number of records per page (default = 10)
     * @param sortBy the field used for sorting (default = examDate)
     * @param sortOrder the sorting direction: ascending or descending (default = descending)
     * @param archivedStatus filter for prescription records:
     *                       ACTIVE, ARCHIVED, or ALL (default = ACTIVE)
     * @return ResponseEntity containing a page of PrescriptionListDTO
     */
    @GetMapping("/api/admin/patient/{id}/prescriptions")
    public ResponseEntity<Page<PrescriptionListDTO>> getAllPatientPrescriptions(@PathVariable UUID id,
                                                                              @RequestParam(defaultValue = "0") int page,
                                                                              @RequestParam(defaultValue = "10") int size,
                                                                              @RequestParam(defaultValue = "examDate") String sortBy,
                                                                              @RequestParam(defaultValue = "descending") String sortOrder,
                                                                              @RequestParam(defaultValue = "ACTIVE") String archivedStatus) {

        Page<PrescriptionListDTO> prescriptionListDTOPage = prescriptionService.getAllPatientPrescriptions(id, page, size, sortBy, sortOrder, archivedStatus);

        return ResponseEntity.ok(prescriptionListDTOPage);
    }

    /**
     * Retrieves detailed information of a specific prescription.
     *
     * This endpoint:
     * - Fetches a prescription using its unique identifier
     * - Throws an exception if the prescription does not exist
     * - Returns complete prescription details
     * - Includes associated prescription item information
     *
     * @param id the UUID of the prescription to retrieve
     * @return ResponseEntity containing PrescriptionDetailsDTO
     */
    @GetMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailsDTO> getPrescription(@PathVariable UUID id) {

        PrescriptionDetailsDTO prescriptionDetailsDTO = prescriptionService.getPrescription(id);
        return ResponseEntity.ok(prescriptionDetailsDTO);
    }

    /**
     * Updates an existing prescription record.
     *
     * This endpoint:
     * - Retrieves the prescription using its unique identifier
     * - Throws an exception if the prescription does not exist
     * - Updates editable prescription fields
     * - Persists the modified prescription data
     * - Returns the updated prescription details
     *
     * @param id the UUID of the prescription to update
     * @param request the request body containing updated prescription information
     * @return ResponseEntity containing the updated PrescriptionDetailsDTO
     */
    @PutMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailsDTO> updatePrescription(@PathVariable UUID id,
                                                                     @Valid @RequestBody UpdatePrescriptionRequestDTO request) {

        PrescriptionDetailsDTO prescriptionDetailsDTO = prescriptionService.updatePrescription(id, request);

        return ResponseEntity.ok(prescriptionDetailsDTO);
    }

    /**
     * Archives a specific prescription record (Soft Delete).
     *
     * This endpoint:
     * - Retrieves the prescription using its unique identifier
     * - Throws an exception if the prescription does not exist
     * - Marks the prescription as archived
     * - Persists the archive update
     * - Excludes the prescription from active record listings
     *
     * @param id the UUID of the prescription to archive
     * @return ResponseEntity with no content upon successful archival
     */
    @DeleteMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<Void> archivePrescription(@PathVariable UUID id) {

        prescriptionService.archivePrescription(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Restores an archived prescription record.
     *
     * This endpoint:
     * - Retrieves the prescription using its unique identifier
     * - Throws an exception if the prescription does not exist
     * - Reverses the archive (soft delete) status
     * - Marks the prescription as active again
     * - Persists the restoration update
     *
     * @param id the UUID of the prescription to restore
     * @return ResponseEntity with no content upon successful restoration
     */
    @PutMapping("/api/admin/prescriptions/{id}/restore")
    public ResponseEntity<Void> restorePrescription(@PathVariable UUID id) {
        prescriptionService.restorePrescription(id);

        return ResponseEntity.noContent().build();
    }
}
