package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.service.CustomUserDetailsService.AuthenticatedUserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class PrescriptionController {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionMapper prescriptionMapper;
    private final PrescriptionItemMapper prescriptionItemMapper;
    private final AuthenticatedUserService authenticatedUserService;

    PrescriptionController(PrescriptionRepository prescriptionRepository,
                           PatientRepository patientRepository,
                           PrescriptionMapper prescriptionMapper,
                           PrescriptionItemMapper prescriptionItemMapper,
                           AuthenticatedUserService authenticatedUserService) {
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.prescriptionMapper = prescriptionMapper;
        this.prescriptionItemMapper = prescriptionItemMapper;
        this.authenticatedUserService = authenticatedUserService;
    }

    @PostMapping("/api/admin/patient/{id}/prescriptions")
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(@PathVariable UUID id, @Valid @RequestBody CreatePrescriptionRequestDTO prescriptionRequest) {

        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Retrieve user
        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Prescription prescription = new Prescription();

        // Set parent fields
        prescription.setExamDate(prescriptionRequest.getExamDate());
        prescription.setNotes(prescriptionRequest.getNotes());
        prescription.setIsArchived(prescriptionRequest.getIsArchived());

        prescription.setPatient(retrievedPatient);
        prescription.setUser(authenticatedUser);

        // Map prescription items
        List<PrescriptionItem> items = prescriptionRequest
                .getItemsRequestDTOList()
                .stream()
                .map(itemDTO -> {
                    PrescriptionItem item = prescriptionItemMapper.requestDTOtoEntity(itemDTO);

                    item.setPrescription(prescription);
                    item.setUser(authenticatedUser);

                    return item;
                }).toList();

        prescription.setPrescriptionItems(items);

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        savedPrescription.getPrescriptionItems()
                .forEach(i -> {
                    System.out.println("ENTITY: " + i.getCorrectionType());
                });

        PrescriptionResponseDTO prescriptionResponseDTO = prescriptionMapper.entityToResponseDTO(savedPrescription);

        prescriptionResponseDTO.getPrescriptionItems()
                .forEach(i -> {
                    System.out.println("DTO: " + i.getCorrectionType());
                });


        return ResponseEntity.ok(prescriptionResponseDTO);
    }

    @GetMapping("/api/admin/patient/{id}/prescriptions")
    public ResponseEntity<Page<PrescriptionListDTO>> getAllPatientPrescriptions(@PathVariable UUID id,
                                                                              @RequestParam(defaultValue = "0") int page,
                                                                              @RequestParam(defaultValue = "10") int size,
                                                                              @RequestParam(defaultValue = "examDate") String sortBy,
                                                                              @RequestParam(defaultValue = "descending") String sortOrder,
                                                                              @RequestParam(defaultValue = "ACTIVE") String archivedStatus) {

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Prescription> prescriptions = switch (archivedStatus.toUpperCase()) {
            case "ARCHIVED" -> prescriptionRepository.findAllByIsArchivedTrueAndPatient_PatientId(id, pageable);
            case "ALL" -> prescriptionRepository.findAllByPatient_PatientId(id, pageable);
            default -> // ACTIVE
                    prescriptionRepository.findAllByIsArchivedFalseAndPatient_PatientId(id, pageable);
        };

        Page<PrescriptionListDTO> prescriptionListDTOS = prescriptions.map(prescriptionMapper::entityToListDTO);

        return ResponseEntity.ok(prescriptionListDTOS);
    }

    @GetMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailsDTO> getPrescription(@PathVariable UUID id) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        PrescriptionDetailsDTO prescriptionDetailsDTO = prescriptionMapper.entityToDetailsDTO(retrievedPrescription);

        return ResponseEntity.ok(prescriptionDetailsDTO);
    }

    @PutMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailsDTO> updatePrescription(@PathVariable UUID id,
                                                                     @Valid @RequestBody UpdatePrescriptionRequestDTO request) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        retrievedPrescription.setExamDate(request.getExamDate());
        retrievedPrescription.setNotes(request.getNotes());

        Prescription updatedPrescription = prescriptionRepository.save(retrievedPrescription);

        PrescriptionDetailsDTO prescriptionDetailsDTO = prescriptionMapper.entityToDetailsDTO(updatedPrescription);

        return ResponseEntity.ok(prescriptionDetailsDTO);
    }

    @DeleteMapping("/api/admin/prescriptions/{id}")
    public ResponseEntity<Void> archivePatient(@PathVariable UUID id) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        retrievedPrescription.setIsArchived(true);

        prescriptionRepository.save(retrievedPrescription);

        return ResponseEntity.noContent().build();
    }

}
