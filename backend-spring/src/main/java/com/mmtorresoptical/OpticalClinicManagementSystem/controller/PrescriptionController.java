package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.PrescriptionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.PrescriptionResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.service.CustomUserDetailsService.AuthenticatedUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(@PathVariable UUID id, @Valid @RequestBody PrescriptionRequestDTO prescriptionRequest) {

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


}
