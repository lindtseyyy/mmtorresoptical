package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.CreateEyeExamRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.EyeExamDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.EyeExamResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.VoidEyeExamRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.EyeExamStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.EyeExamMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.EyeExamRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.EyeExamAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.EyeExamSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import jakarta.persistence.EntityManager;
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
public class EyeExamService {

    private final PatientRepository patientRepository;
    private final EyeExamRepository eyeExamRepository;
    private final EyeExamMapper eyeExamMapper;
    private final AuthenticatedUserService authenticatedUserService;
    private final EyeExamAuditHelper eyeExamAuditHelper;
    private final EntityManager entityManager;

    @Transactional
    public EyeExamResponseDTO createEyeExam(UUID patientId, CreateEyeExamRequestDTO requestDTO) {
        Patient retrievedPatient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        EyeExam eyeExam = eyeExamMapper.createDTOToEntity(requestDTO);

        // Snapshot the patient's current medical history into this exam
        eyeExam.setMedicalHistorySnapshot(retrievedPatient.getMedicalHistory());

        eyeExam.setPatient(retrievedPatient);
        eyeExam.setPerformedBy(authenticatedUser);

        EyeExam savedExam = eyeExamRepository.saveAndFlush(eyeExam);
        entityManager.refresh(savedExam);

        eyeExamAuditHelper.logCreate(savedExam);

        return eyeExamMapper.entityToResponseDTO(savedExam);
    }

    public Page<EyeExamDetailsDTO> getAllEyeExams(UUID patientId,
                                                   String keyword,
                                                   LocalDate minDate,
                                                   LocalDate maxDate,
                                                   int page,
                                                   int size,
                                                   String sortBy,
                                                   String sortOrder,
                                                   String status) {

        Specification<EyeExam> spec = Specification.allOf();

        if (keyword != null && UUIDUtils.isUUID(keyword)) {
            Optional<EyeExam> eyeExam = eyeExamRepository.findById(UUID.fromString(keyword));
            if (eyeExam.isEmpty()) {
                return Page.empty();
            }
            return new PageImpl<>(
                    List.of(eyeExamMapper.entityToDetailsDTO(eyeExam.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        if (minDate != null || maxDate != null) {
            spec = spec.and(EyeExamSpecification.dateBetween(minDate, maxDate));
        }

        spec = spec.and(EyeExamSpecification.hasStatus(status));
        spec = spec.and(EyeExamSpecification.hasPatientId(patientId));

        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            direction = Sort.Direction.DESC;
        }

        Sort sort = Sort.by(Sort.Direction.ASC, "status")
                .and(Sort.by(direction, sortBy));
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<EyeExam> eyeExams = eyeExamRepository.findAll(spec, pageable);

        return eyeExams.map(eyeExamMapper::entityToDetailsDTO);
    }

    public EyeExamDetailsDTO getEyeExam(UUID id) {
        EyeExam eyeExam = eyeExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Eye exam not found with id: " + id));
        return eyeExamMapper.entityToDetailsDTO(eyeExam);
    }

    public void voidEyeExam(UUID id, VoidEyeExamRequestDTO request) {
        EyeExam eyeExam = eyeExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Eye exam not found with id: " + id));

        if (eyeExam.getStatus() == EyeExamStatus.VOIDED) {
            throw new IllegalStateException("Eye exam is already voided");
        }

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        eyeExam.setStatus(EyeExamStatus.VOIDED);
        eyeExam.setVoidReason(request.getVoidReason());
        eyeExam.setVoidedAt(LocalDateTime.now());
        eyeExam.setVoidedBy(authenticatedUser);

        eyeExamRepository.save(eyeExam);

        eyeExamAuditHelper.logVoid(eyeExam);
    }
}
