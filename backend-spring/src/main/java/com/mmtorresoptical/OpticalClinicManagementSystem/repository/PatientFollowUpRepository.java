package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PatientFollowUpRepository
    extends JpaRepository<PatientFollowUp, UUID>, JpaSpecificationExecutor<PatientFollowUp> {

    List<PatientFollowUp> findByPrescriptionPrescriptionIdOrderByScheduledDateDesc(UUID prescriptionId);

    List<PatientFollowUp> findByPatientPatientIdOrderByScheduledDateDesc(UUID patientId);

    List<PatientFollowUp> findByPatientPatientIdAndStatusOrderByScheduledDateDesc(
        UUID patientId, FollowUpStatus status);

    @Query("SELECT COUNT(f) FROM PatientFollowUp f WHERE f.status = 'PENDING' AND f.isArchived = false")
    long countPendingFollowUps();

    @Query("SELECT COUNT(f) FROM PatientFollowUp f WHERE f.status = 'PENDING' AND f.scheduledDate < :cutoffDate AND f.isArchived = false")
    long countStalePendingFollowUps(@Param("cutoffDate") LocalDate cutoffDate);
}
