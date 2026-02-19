package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.PrescriptionListDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
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

}
