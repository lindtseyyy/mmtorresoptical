package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.patient.PatientAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PatientMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.basehelper.AuditLogHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PatientAuditHelper implements AuditLogHelper<Patient> {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final PatientMapper patientMapper;

    @Override
    public void logCreate(Patient patient) {

        PatientAuditDTO auditDTO =
                patientMapper.entityToAuditDTO(patient);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PATIENT,
                patient.getPatientId(),
                "Created patient record",
                detailsJson
        );
    }

    @Override
    public void logUpdate(Patient beforePatient, Patient afterPatient) {

        PatientAuditDTO before =
                patientMapper.entityToAuditDTO(beforePatient);

        PatientAuditDTO after =
                patientMapper.entityToAuditDTO(afterPatient);

        AuditUpdateEvent<PatientAuditDTO> event =
                new AuditUpdateEvent<>(before, after);

        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.PATIENT,
                after.getPatientId(),
                "Updated patient record",
                detailsJson
        );
    }

    @Override
    public void logArchive(Patient patient) {

        PatientAuditDTO auditDTO =
                patientMapper.entityToAuditDTO(patient);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.PATIENT,
                patient.getPatientId(),
                "Archived patient record",
                detailsJson
        );
    }

    @Override
    public void logRestore(Patient patient) {

        PatientAuditDTO auditDTO =
                patientMapper.entityToAuditDTO(patient);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.PATIENT,
                patient.getPatientId(),
                "Restored patient record",
                detailsJson
        );
    }

}