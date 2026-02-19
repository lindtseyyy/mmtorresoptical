package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.UpdatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionItemsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrescriptionItemsService {

    private final PrescriptionItemsRepository prescriptionItemsRepository;
    private final PrescriptionItemMapper prescriptionItemMapper;

    public Page<PrescriptionItemDetailsDTO> getAllPrescriptionItems(UUID id,
                                                                    int page,
                                                                    int size,
                                                                    String sortBy,
                                                                    String sortOrder,
                                                                    String archivedStatus) {

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
        Page<PrescriptionItem> prescriptionItems = switch (archivedStatus.toUpperCase()) {
            case "ARCHIVED" -> prescriptionItemsRepository.findAllByIsArchivedTrueAndPrescription_PrescriptionId(id, pageable);
            case "ALL" -> prescriptionItemsRepository.findAllByPrescription_PrescriptionId(id, pageable);
            default -> // ACTIVE
                    prescriptionItemsRepository.findAllByIsArchivedFalseAndPrescription_PrescriptionId(id, pageable);
        };

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

    public PrescriptionItemDetailsDTO updatePrescription(UUID id, UpdatePrescriptionItemRequestDTO updatePrescriptionItemRequestDTO) {
        // Retrieve prescription or throw exception if not found
        PrescriptionItem retrievedPrescriptionItem = prescriptionItemsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription Item not found with id: " + id));

        prescriptionItemMapper.updatePrescriptionItemFromDTO(updatePrescriptionItemRequestDTO, retrievedPrescriptionItem);

        PrescriptionItem updatedPrescriptionItem = prescriptionItemsRepository.save(retrievedPrescriptionItem);

        return prescriptionItemMapper.entityToDetailsDTO(updatedPrescriptionItem);
    }

    public void archivePrescriptionItem(UUID id) {
        // Retrieve prescription or throw exception if not found
        PrescriptionItem retrievedPrescriptionItem = prescriptionItemsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription Item not found with id: " + id));

        retrievedPrescriptionItem.setIsArchived(true);

        prescriptionItemsRepository.save(retrievedPrescriptionItem);
    }

    public void restorePrescriptionItem(UUID id) {
        // Retrieve prescription or throw exception if not found
        PrescriptionItem retrievedPrescriptionItem = prescriptionItemsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription Item not found with id: " + id));

        retrievedPrescriptionItem.setIsArchived(false);

        prescriptionItemsRepository.save(retrievedPrescriptionItem);
    }

}
