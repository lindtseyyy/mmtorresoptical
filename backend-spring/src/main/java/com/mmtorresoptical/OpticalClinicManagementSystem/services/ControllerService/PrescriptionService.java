package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionItemsRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

        // Map the prescription entity to prescription response DTO and return
        return prescriptionMapper.entityToResponseDTO(savedPrescription);
    }

    public Page<PrescriptionListDTO> getAllPatientPrescriptions(UUID id,
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
        Page<Prescription> prescriptions = switch (archivedStatus.toUpperCase()) {
            case "ARCHIVED" -> prescriptionRepository.findAllByIsArchivedTrueAndPatient_PatientId(id, pageable);
            case "ALL" -> prescriptionRepository.findAllByPatient_PatientId(id, pageable);
            default -> // ACTIVE
                    prescriptionRepository.findAllByIsArchivedFalseAndPatient_PatientId(id, pageable);
        };

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

        // Update the fields
        retrievedPrescription.setExamDate(request.getExamDate());
        retrievedPrescription.setNotes(request.getNotes());

        // Persist the update prescription
        Prescription updatedPrescription = prescriptionRepository.save(retrievedPrescription);

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
    }

    public void restorePrescription(UUID id) {
        // Retrieve prescription or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        // Update the isArchived field
        retrievedPrescription.setIsArchived(false);

        // Persist the updated prescription
        prescriptionRepository.save(retrievedPrescription);
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

        return newItems.stream().map(prescriptionItemMapper::entityToDetailsDTO).toList();
    }
}
