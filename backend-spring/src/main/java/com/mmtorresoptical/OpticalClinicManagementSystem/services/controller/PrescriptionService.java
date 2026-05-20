package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PrescriptionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.MethodNotAllowedException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionItemsRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.EyeExamRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientFollowUpRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PatientFollowUpAuditHelper;
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
import java.time.LocalDateTime;
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
    private final PatientFollowUpRepository patientFollowUpRepository;
    private final PatientFollowUpAuditHelper patientFollowUpAuditHelper;
    private final EyeExamRepository eyeExamRepository;

    public PrescriptionResponseDTO createPrescription(UUID id, CreatePrescriptionRequestDTO prescriptionRequest) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Retrieve user
        User authenticatedUser = authenticatedUserService.getCurrentUser();

        // Create new prescription
        Prescription prescription = new Prescription();

        // Set parent fields
        prescription.setIssueDate(prescriptionRequest.getIssueDate());
        prescription.setNotes(prescriptionRequest.getNotes());
        prescription.setIsArchived(prescriptionRequest.getIsArchived());

        prescription.setPatient(retrievedPatient);
        prescription.setUser(authenticatedUser);

        // Link to eye exam if provided
        if (prescriptionRequest.getEyeExamId() != null) {
            EyeExam eyeExam = eyeExamRepository.findById(prescriptionRequest.getEyeExamId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Eye exam not found with id: " + prescriptionRequest.getEyeExamId()));
            prescription.setEyeExam(eyeExam);
        }

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

        // Create follow-up only if an explicit scheduled date was provided
        if (prescriptionRequest.getFollowUpScheduledDate() != null) {
            PatientFollowUp followUp = new PatientFollowUp();
            followUp.setPrescription(savedPrescription);
            followUp.setPatient(retrievedPatient);
            followUp.setScheduledDate(prescriptionRequest.getFollowUpScheduledDate());
            followUp.setFollowUpReason(prescriptionRequest.getFollowUpReason());
            followUp.setStatus(FollowUpStatus.PENDING);
            followUp.setCreatedBy(authenticatedUser);
            patientFollowUpRepository.save(followUp);
            patientFollowUpAuditHelper.logCreate(followUp);
        }

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
        // Always sort active before archived, then by the requested field
        Sort sort = Sort.by(Sort.Direction.ASC, "isArchived")
                .and(Sort.by(direction, sortBy));
        Pageable pageable = PageRequest.of(page, size, sort);

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
        throw new MethodNotAllowedException("PUT is disabled on prescriptions. Medical records are immutable. Use POST /api/admin/prescriptions/{id}/void to void, or POST /api/admin/prescriptions/{id}/clone to create a new version.");
    }

    public void archivePrescription(UUID id) {
        throw new MethodNotAllowedException("DELETE is disabled on prescriptions. Medical records are immutable. Use POST /api/admin/prescriptions/{id}/void to void this record.");
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
    public void voidPrescription(UUID id, VoidPrescriptionRequestDTO request) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        if (prescription.getStatus() == PrescriptionStatus.VOIDED) {
            throw new IllegalStateException("Prescription is already voided");
        }

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        prescription.setStatus(PrescriptionStatus.VOIDED);
        prescription.setVoidReason(request.getVoidReason());
        prescription.setVoidedAt(LocalDateTime.now());
        prescription.setVoidedBy(authenticatedUser);

        prescriptionRepository.save(prescription);

        prescriptionAuditHelper.logVoid(prescription);
    }

    @Transactional
    public PrescriptionResponseDTO clonePrescription(UUID id) {
        Prescription source = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Prescription clone = new Prescription();
        clone.setIssueDate(LocalDate.now());
        clone.setNotes(source.getNotes());
        clone.setIsArchived(false);
        clone.setStatus(PrescriptionStatus.ACTIVE);
        clone.setPatient(source.getPatient());
        clone.setUser(authenticatedUser);
        clone.setEyeExam(source.getEyeExam());

        List<PrescriptionItem> clonedItems = source.getPrescriptionItems().stream()
                .map(item -> {
                    PrescriptionItem newItem = new PrescriptionItem();
                    BeanUtils.copyProperties(item, newItem, "prescriptionItemId", "prescription", "user", "createdAt", "isArchived");
                    newItem.setPrescription(clone);
                    newItem.setUser(authenticatedUser);
                    newItem.setIsArchived(false);
                    return newItem;
                }).toList();
        clone.setPrescriptionItems(clonedItems);

        Prescription saved = prescriptionRepository.save(clone);
        prescriptionAuditHelper.logCreate(saved);
        return prescriptionMapper.entityToResponseDTO(saved);
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
