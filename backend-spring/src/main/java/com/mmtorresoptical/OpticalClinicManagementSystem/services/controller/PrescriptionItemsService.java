package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.UpdatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionItemsRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PrescriptionItemAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.PrescriptionItemSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrescriptionItemsService {

    private final PrescriptionItemsRepository prescriptionItemsRepository;
    private final PrescriptionItemMapper prescriptionItemMapper;
    private final PrescriptionItemAuditHelper prescriptionItemAuditHelper;

    public Page<PrescriptionItemDetailsDTO> getAllPrescriptionItems(UUID prescriptionId,
                                                                    String keyword,
                                                                    LocalDate minDate,
                                                                    LocalDate maxDate,
                                                                    int page,
                                                                    int size,
                                                                    String sortBy,
                                                                    String sortOrder,
                                                                    String archivedStatus) {


        Specification<PrescriptionItem> spec = Specification.allOf();

        if (keyword != null && UUIDUtils.isUUID(keyword)) {

            Optional<PrescriptionItem> prescriptionItem =
                    prescriptionItemsRepository.findById(UUID.fromString(keyword));

            if (prescriptionItem.isEmpty()) {
                return Page.empty();
            }

            return new PageImpl<>(
                    List.of(prescriptionItemMapper.entityToDetailsDTO(prescriptionItem.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    PrescriptionItemSpecification.dateBetween(minDate, maxDate)
            );
        }

        spec = spec.and(
                PrescriptionItemSpecification.hasArchivedStatus(archivedStatus)
        );

        spec = spec.and(
                PrescriptionItemSpecification.hasPrescriptionId(prescriptionId)
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
        // Filters based on the archived status
        Page<PrescriptionItem> prescriptionItems = prescriptionItemsRepository.findAll(spec, pageable);

        // Map each of prescription entity to prescription listDTO and return
        return prescriptionItems.map(prescriptionItemMapper::entityToDetailsDTO);
    }

    public PrescriptionItemDetailsDTO getPrescription(UUID id) {
        // Retrieve prescription or throw exception if not found
        PrescriptionItem retrievedPrescriptionItem = prescriptionItemsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription Item not found with id: " + id));

        // Map prescription entity to prescription details DTO
        PrescriptionItemDetailsDTO prescriptionDetailsDTO = prescriptionItemMapper.entityToDetailsDTO(retrievedPrescriptionItem);

        return prescriptionDetailsDTO;
    }

    public PrescriptionItemDetailsDTO updatePrescriptionItem(UUID id, UpdatePrescriptionItemRequestDTO updatePrescriptionItemRequestDTO) {
        // Retrieve prescription or throw exception if not found
        PrescriptionItem retrievedPrescriptionItem = prescriptionItemsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription Item not found with id: " + id));

        // Create a copy for logging (BEFORE snapshot)
        PrescriptionItem beforeUpdate = new PrescriptionItem();
        BeanUtils.copyProperties(retrievedPrescriptionItem, beforeUpdate);

        prescriptionItemMapper.updatePrescriptionItemFromDTO(updatePrescriptionItemRequestDTO, retrievedPrescriptionItem);

        PrescriptionItem updatedPrescriptionItem = prescriptionItemsRepository.save(retrievedPrescriptionItem);

        // Audit Logging
        prescriptionItemAuditHelper.logUpdate(beforeUpdate, updatedPrescriptionItem);

        return prescriptionItemMapper.entityToDetailsDTO(updatedPrescriptionItem);
    }

    public void archivePrescriptionItem(UUID id) {
        // Retrieve prescription or throw exception if not found
        PrescriptionItem retrievedPrescriptionItem = prescriptionItemsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription Item not found with id: " + id));

        retrievedPrescriptionItem.setIsArchived(true);

        prescriptionItemsRepository.save(retrievedPrescriptionItem);

        // Audit Logging
        prescriptionItemAuditHelper.logArchive(retrievedPrescriptionItem);
    }

    public void restorePrescriptionItem(UUID id) {
        // Retrieve prescription or throw exception if not found
        PrescriptionItem retrievedPrescriptionItem = prescriptionItemsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription Item not found with id: " + id));

        retrievedPrescriptionItem.setIsArchived(false);

        prescriptionItemsRepository.save(retrievedPrescriptionItem);

        // Audit Logging
        prescriptionItemAuditHelper.logRestore(retrievedPrescriptionItem);
    }

}
