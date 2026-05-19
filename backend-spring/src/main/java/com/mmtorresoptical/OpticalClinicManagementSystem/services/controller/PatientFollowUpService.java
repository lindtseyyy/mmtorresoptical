package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.PatientFollowUpDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.RescheduleFollowUpRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.followup.UpdateFollowUpStatusRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientFollowUp;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientFollowUpRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientFollowUpService {

    private final PatientFollowUpRepository patientFollowUpRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public List<PatientFollowUpDTO> getFollowUpsByPrescription(UUID prescriptionId) {
        return patientFollowUpRepository
                .findByPrescriptionPrescriptionIdOrderByScheduledDateDesc(prescriptionId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<PatientFollowUpDTO> getFollowUpsByPatient(UUID patientId, String statusFilter) {
        List<PatientFollowUp> followUps;
        if (statusFilter != null && !statusFilter.isEmpty()) {
            FollowUpStatus status = FollowUpStatus.valueOf(statusFilter);
            followUps = patientFollowUpRepository
                    .findByPatientPatientIdAndStatusOrderByScheduledDateDesc(patientId, status);
        } else {
            followUps = patientFollowUpRepository
                    .findByPatientPatientIdOrderByScheduledDateDesc(patientId);
        }
        return followUps.stream().map(this::toDTO).toList();
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
        followUp.setUpdatedBy(authenticatedUserService.getCurrentUser());
        PatientFollowUp saved = patientFollowUpRepository.save(followUp);
        return toDTO(saved);
    }

    private PatientFollowUpDTO toDTO(PatientFollowUp entity) {
        PatientFollowUpDTO dto = new PatientFollowUpDTO();
        dto.setFollowUpId(entity.getFollowUpId());
        if (entity.getPrescription() != null) {
            dto.setPrescriptionId(entity.getPrescription().getPrescriptionId());
        }
        dto.setPatientId(entity.getPatient().getPatientId());
        dto.setScheduledDate(entity.getScheduledDate());
        dto.setActualVisitDate(entity.getActualVisitDate());
        dto.setStatus(entity.getStatus().name());
        dto.setFollowUpReason(entity.getFollowUpReason());
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
