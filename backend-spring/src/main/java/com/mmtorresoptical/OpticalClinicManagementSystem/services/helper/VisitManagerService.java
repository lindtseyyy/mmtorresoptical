package com.mmtorresoptical.OpticalClinicManagementSystem.services.helper;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientFollowUp;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientVisit;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientFollowUpRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientVisitRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PatientFollowUpAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PatientVisitAuditHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VisitManagerService {

    private final PatientVisitRepository visitRepository;
    private final PatientFollowUpRepository followUpRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final PatientVisitAuditHelper visitAuditHelper;
    private final PatientFollowUpAuditHelper followUpAuditHelper;

    /**
     * Finds the most recent visit for the patient today, or creates a new default one.
     * Then auto-completes any PENDING follow-up scheduled for today.
     */
    public PatientVisit linkToLatestOrCreateVisit(Patient patient, String defaultPurpose) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        // Step A: Find most recent visit today or create new
        Optional<PatientVisit> existingVisit = visitRepository
                .findTopByPatientPatientIdAndVisitTimestampBetweenOrderByVisitTimestampDesc(
                        patient.getPatientId(), startOfDay, endOfDay);

        PatientVisit visit;
        if (existingVisit.isPresent()) {
            visit = existingVisit.get();
        } else {
            User currentUser = authenticatedUserService.getCurrentUser();
            visit = new PatientVisit();
            visit.setPatient(patient);
            visit.setVisitTimestamp(LocalDateTime.now());
            visit.setPurpose(defaultPurpose);
            visit.setLoggedBy(currentUser);
            visit = visitRepository.save(visit);
            visitAuditHelper.logCreate(visit);
        }

        // Step B & C: Auto-complete pending follow-up for today
        Optional<PatientFollowUp> pendingFollowUp = followUpRepository
                .findByPatientPatientIdAndScheduledDateAndStatus(
                        patient.getPatientId(), today, FollowUpStatus.PENDING);

        if (pendingFollowUp.isPresent()) {
            PatientFollowUp followUp = pendingFollowUp.get();
            PatientFollowUp before = copyForAudit(followUp);

            followUp.setStatus(FollowUpStatus.COMPLETED);
            followUp.setActualVisitDate(today);
            followUp.setCompletedByVisitId(visit.getVisitId());
            followUp.setUpdatedBy(authenticatedUserService.getCurrentUser());

            PatientFollowUp saved = followUpRepository.save(followUp);
            followUpAuditHelper.logUpdate(before, saved);
        }

        return visit;
    }

    private PatientFollowUp copyForAudit(PatientFollowUp source) {
        PatientFollowUp copy = new PatientFollowUp();
        copy.setFollowUpId(source.getFollowUpId());
        copy.setPatient(source.getPatient());
        copy.setPrescription(source.getPrescription());
        copy.setEyeExam(source.getEyeExam());
        copy.setScheduledDate(source.getScheduledDate());
        copy.setActualVisitDate(source.getActualVisitDate());
        copy.setCompletedByVisitId(source.getCompletedByVisitId());
        copy.setStatus(source.getStatus());
        copy.setFollowUpReason(source.getFollowUpReason());
        copy.setIsArchived(source.getIsArchived());
        copy.setCreatedAt(source.getCreatedAt());
        copy.setUpdatedAt(source.getUpdatedAt());
        copy.setCreatedBy(source.getCreatedBy());
        copy.setUpdatedBy(source.getUpdatedBy());
        return copy;
    }
}
