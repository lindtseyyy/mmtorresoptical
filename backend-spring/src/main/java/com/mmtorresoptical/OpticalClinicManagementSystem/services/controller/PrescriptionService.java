package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionItemsRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PrescriptionAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PrescriptionItemAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.PrescriptionSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionMapper prescriptionMapper;
    private final PrescriptionItemMapper prescriptionItemMapper;
    private final AuthenticatedUserService authenticatedUserService;
    private final PrescriptionItemsRepository prescriptionItemsRepository;
    private final PrescriptionAuditHelper prescriptionAuditHelper;
    private final PrescriptionItemAuditHelper prescriptionItemAuditHelper;

    public PrescriptionResponseDTO createPrescription(UUID id, CreatePrescriptionRequestDTO prescriptionRequest) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Retrieve user
        User authenticatedUser = authenticatedUserService.getCurrentUser();

        // Create new prescription
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
                    PrescriptionItem item = prescriptionItemMapper.createRequestDTOtoEntity(itemDTO);

                    item.setPrescription(prescription);
                    item.setUser(authenticatedUser);

                    return item;
                }).toList();

        // Set the relationship
        prescription.setPrescriptionItems(items);

        // Save the prescription
        Prescription savedPrescription = prescriptionRepository.save(prescription);

        // Audit Logging
        prescriptionAuditHelper.logCreate(savedPrescription);

        // Map the prescription entity to prescription response DTO and return
        return prescriptionMapper.entityToResponseDTO(savedPrescription);
    }

    public Page<PrescriptionListDTO> getAllPatientPrescriptions(UUID patientId,
                                                                String keyword,
                                                                LocalDate minDate,
                                                                LocalDate maxDate,
                                                                int page,
                                                                int size,
                                                                String sortBy,
                                                                String sortOrder,
                                                                String archivedStatus) {


        Specification<Prescription> spec = Specification.allOf();

        if (keyword != null && UUIDUtils.isUUID(keyword)) {

            Optional<Prescription> prescription =
                    prescriptionRepository.findById(UUID.fromString(keyword));

            if (prescription.isEmpty()) {
                return Page.empty();
            }

            return new PageImpl<>(
                    List.of(prescriptionMapper.entityToListDTO(prescription.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    PrescriptionSpecification.dateBetween(minDate, maxDate)
            );
        }

        spec = spec.and(
                PrescriptionSpecification.hasArchivedStatus(archivedStatus)
        );

        spec = spec.and(
                PrescriptionSpecification.hasPatientId(patientId)
        );

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

        // Fetches prescriptions associated with the given patient ID
        Page<Prescription> prescriptions = prescriptionRepository.findAll(spec, pageable);

        // Map each of prescription entity to prescription listDTO and return
        return prescriptions.map(prescriptionMapper::entityToListDTO);
    }

    public PrescriptionDetailsDTO getPrescription(UUID id) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        // Map prescription entity to prescription details DTO and return
        return prescriptionMapper.entityToDetailsDTO(retrievedPrescription);
    }

    public PrescriptionDetailsDTO updatePrescription(UUID id, UpdatePrescriptionRequestDTO updatePrescriptionRequestDTO) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        // Create a copy for logging (BEFORE snapshot)
        Prescription beforeUpdate = new Prescription();
        BeanUtils.copyProperties(retrievedPrescription, beforeUpdate);

        // Update the fields
        retrievedPrescription.setExamDate(updatePrescriptionRequestDTO.getExamDate());
        retrievedPrescription.setNotes(updatePrescriptionRequestDTO.getNotes());

        // Persist the update prescription
        Prescription updatedPrescription = prescriptionRepository.save(retrievedPrescription);

        // Audit Logging
        prescriptionAuditHelper.logUpdate(beforeUpdate, updatedPrescription);

        // Map the prescription entity to prescription details DTO
        return prescriptionMapper.entityToDetailsDTO(updatedPrescription);
    }

    public void archivePrescription(UUID id) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        // Update the isArchived field
        retrievedPrescription.setIsArchived(true);

        // Persist the updated prescription
        prescriptionRepository.save(retrievedPrescription);

        // Audit Logging
        prescriptionAuditHelper.logArchive(retrievedPrescription);
    }

    public void restorePrescription(UUID id) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        // Update the isArchived field
        retrievedPrescription.setIsArchived(false);

        // Persist the updated prescription
        prescriptionRepository.save(retrievedPrescription);

        // Audit Logging
        prescriptionAuditHelper.logRestore(retrievedPrescription);
    }

    @Transactional
    public List<PrescriptionItemDetailsDTO> addItems(UUID prescriptionId,
                                                     List<CreatePrescriptionItemRequestDTO> createPrescriptionItemRequestDTOList) {

        // Retrieve patient or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        List<PrescriptionItem> newItems = createPrescriptionItemRequestDTOList
                .stream()
                .map(dto -> {
                            PrescriptionItem item = prescriptionItemMapper.createRequestDTOtoEntity(dto);

                            item.setPrescription(retrievedPrescription);
                            item.setUser(authenticatedUser);

                            return item;
                        }
                        ).toList();

        prescriptionItemsRepository.saveAll(newItems);

        // Audit Logging
        int count = newItems.size();

        if (count == 1) {
            prescriptionItemAuditHelper.logCreate(newItems.get(0));
        } else {
            prescriptionItemAuditHelper.logCreateBatch(newItems);
        }

        return newItems.stream().map(prescriptionItemMapper::entityToDetailsDTO).toList();
    }
}
