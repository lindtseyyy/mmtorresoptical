package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.visit.LogVisitRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.visit.PatientVisitDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientVisit;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientVisitRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PatientVisitAuditHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientVisitService {

    private final PatientVisitRepository visitRepository;
    private final PatientRepository patientRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final PatientVisitAuditHelper auditHelper;
    private final PatientFollowUpService followUpService;

    @Transactional
    public PatientVisitDTO logVisit(UUID patientId, LogVisitRequestDTO request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        PatientVisit visit = new PatientVisit();
        visit.setPatient(patient);
        visit.setVisitTimestamp(request.getVisitTimestamp() != null ? request.getVisitTimestamp() : LocalDateTime.now());
        visit.setPurpose(request.getPurpose());
        visit.setNotes(request.getNotes());
        visit.setLoggedBy(authenticatedUserService.getCurrentUser());

        PatientVisit saved = visitRepository.save(visit);
        auditHelper.logCreate(saved);

        if (request.getFollowUpId() != null) {
            followUpService.completeAndLinkToVisit(request.getFollowUpId(), saved.getVisitId());
        }

        return toDTO(saved);
    }

    public List<PatientVisitDTO> getVisitsByPatient(UUID patientId) {
        return visitRepository.findByPatientPatientIdOrderByVisitTimestampDesc(patientId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private PatientVisitDTO toDTO(PatientVisit entity) {
        PatientVisitDTO dto = new PatientVisitDTO();
        dto.setVisitId(entity.getVisitId());
        dto.setPatientId(entity.getPatient().getPatientId());
        dto.setVisitTimestamp(entity.getVisitTimestamp());
        dto.setPurpose(entity.getPurpose());
        dto.setNotes(entity.getNotes());
        if (entity.getLoggedBy() != null) {
            UserSummaryDTO loggedBy = new UserSummaryDTO();
            loggedBy.setUserId(entity.getLoggedBy().getUserId().toString());
            loggedBy.setFullName(entity.getLoggedBy().getFullNameSortable());
            dto.setLoggedBy(loggedBy);
        }
        return dto;
    }
}
