package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.CreateFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.PatientFollowUpDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.RescheduleFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.UpdateFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.UpdateFollowUpStatusRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientFollowUp;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientFollowUpRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.EyeExamRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PatientFollowUpAuditHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientFollowUpService {

    private final PatientFollowUpRepository patientFollowUpRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final EyeExamRepository eyeExamRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final PatientFollowUpAuditHelper patientFollowUpAuditHelper;

    @Transactional
    public PatientFollowUpDTO createFollowUp(CreateFollowUpRequestDTO request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientId()));

        PatientFollowUp followUp = new PatientFollowUp();
        followUp.setPatient(patient);
        followUp.setScheduledDate(request.getScheduledDate());
        followUp.setFollowUpReason(request.getFollowUpReason());
        followUp.setStatus(FollowUpStatus.PENDING);
        followUp.setCreatedBy(authenticatedUserService.getCurrentUser());

        if (request.getPrescriptionId() != null) {
            Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prescription not found: " + request.getPrescriptionId()));
            followUp.setPrescription(prescription);
        }

        if (request.getEyeExamId() != null) {
            EyeExam eyeExam = eyeExamRepository.findById(request.getEyeExamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Eye exam not found: " + request.getEyeExamId()));
            followUp.setEyeExam(eyeExam);
        }

        PatientFollowUp saved = patientFollowUpRepository.save(followUp);
        patientFollowUpAuditHelper.logCreate(saved);
        return toDTO(saved);
    }

    @Transactional
    public PatientFollowUpDTO updateFollowUp(UUID id, UpdateFollowUpRequestDTO request) {
        PatientFollowUp followUp = patientFollowUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + id));

        PatientFollowUp before = copyForAudit(followUp);

        if (request.getScheduledDate() != null) {
            followUp.setScheduledDate(request.getScheduledDate());
            if (followUp.getStatus() == FollowUpStatus.NO_SHOW || followUp.getStatus() == FollowUpStatus.CANCELLED) {
                followUp.setStatus(FollowUpStatus.PENDING);
            }
        }
        if (request.getFollowUpReason() != null) {
            followUp.setFollowUpReason(request.getFollowUpReason());
        }
        followUp.setUpdatedBy(authenticatedUserService.getCurrentUser());

        PatientFollowUp saved = patientFollowUpRepository.save(followUp);
        patientFollowUpAuditHelper.logUpdate(before, saved);
        return toDTO(saved);
    }

    @Transactional
    public void archiveFollowUp(UUID id) {
        PatientFollowUp followUp = patientFollowUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + id));

        followUp.setIsArchived(true);
        followUp.setUpdatedBy(authenticatedUserService.getCurrentUser());
        patientFollowUpRepository.save(followUp);

        patientFollowUpAuditHelper.logArchive(followUp);
    }

    @Transactional
    public void restoreFollowUp(UUID id) {
        PatientFollowUp followUp = patientFollowUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + id));

        followUp.setIsArchived(false);
        followUp.setUpdatedBy(authenticatedUserService.getCurrentUser());
        patientFollowUpRepository.save(followUp);

        patientFollowUpAuditHelper.logRestore(followUp);
    }

    public List<PatientFollowUpDTO> getFollowUpsByPrescription(UUID prescriptionId) {
        return patientFollowUpRepository
                .findByPrescriptionPrescriptionIdOrderByScheduledDateDesc(prescriptionId)
                .stream()
                .filter(fu -> !Boolean.TRUE.equals(fu.getIsArchived()))
                .map(this::toDTO)
                .toList();
    }

    public Page<PatientFollowUpDTO> getFollowUpsByPatient(UUID patientId, String statusFilter, boolean includeArchived, Pageable pageable) {
        Specification<PatientFollowUp> spec = (root, query, cb) ->
                cb.equal(root.get("patient").get("patientId"), patientId);

        if (statusFilter != null && !statusFilter.isEmpty()) {
            FollowUpStatus status = FollowUpStatus.valueOf(statusFilter.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (!includeArchived) {
            spec = spec.and((root, query, cb) -> cb.isFalse(root.get("isArchived")));
        }

        return patientFollowUpRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Transactional
    public PatientFollowUpDTO updateStatus(UUID followUpId, UpdateFollowUpStatusRequestDTO request) {
        PatientFollowUp followUp = patientFollowUpRepository.findById(followUpId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + followUpId));

        FollowUpStatus newStatus = FollowUpStatus.valueOf(request.getStatus());
        followUp.setStatus(newStatus);

        if (newStatus == FollowUpStatus.COMPLETED) {
            followUp.setActualVisitDate(LocalDate.now());
        }

        followUp.setUpdatedBy(authenticatedUserService.getCurrentUser());
        PatientFollowUp saved = patientFollowUpRepository.save(followUp);
        return toDTO(saved);
    }

    @Transactional
    public PatientFollowUpDTO reschedule(UUID followUpId, RescheduleFollowUpRequestDTO request) {
        PatientFollowUp followUp = patientFollowUpRepository.findById(followUpId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found: " + followUpId));

        followUp.setScheduledDate(request.getScheduledDate());
        if (followUp.getStatus() == FollowUpStatus.NO_SHOW || followUp.getStatus() == FollowUpStatus.CANCELLED) {
            followUp.setStatus(FollowUpStatus.PENDING);
        }
        followUp.setUpdatedBy(authenticatedUserService.getCurrentUser());
        PatientFollowUp saved = patientFollowUpRepository.save(followUp);
        return toDTO(saved);
    }

    private PatientFollowUp copyForAudit(PatientFollowUp source) {
        PatientFollowUp copy = new PatientFollowUp();
        copy.setFollowUpId(source.getFollowUpId());
        copy.setScheduledDate(source.getScheduledDate());
        copy.setFollowUpReason(source.getFollowUpReason());
        copy.setStatus(source.getStatus());
        copy.setIsArchived(source.getIsArchived());
        return copy;
    }

    private PatientFollowUpDTO toDTO(PatientFollowUp entity) {
        PatientFollowUpDTO dto = new PatientFollowUpDTO();
        dto.setFollowUpId(entity.getFollowUpId());
        if (entity.getPrescription() != null) {
            dto.setPrescriptionId(entity.getPrescription().getPrescriptionId());
        }
        if (entity.getEyeExam() != null) {
            dto.setEyeExamId(entity.getEyeExam().getEyeExamId());
        }
        dto.setPatientId(entity.getPatient().getPatientId());
        dto.setScheduledDate(entity.getScheduledDate());
        dto.setActualVisitDate(entity.getActualVisitDate());
        dto.setStatus(entity.getStatus().name());
        dto.setFollowUpReason(entity.getFollowUpReason());
        dto.setIsArchived(entity.getIsArchived());
        dto.setCreatedAt(entity.getCreatedAt());
        if (entity.getCreatedBy() != null) {
            UserSummaryDTO createdBy = new UserSummaryDTO();
            createdBy.setUserId(entity.getCreatedBy().getUserId().toString());
            createdBy.setFullName(entity.getCreatedBy().getFullNameSortable());
            dto.setCreatedBy(createdBy);
        }
        return dto;
    }
}
