package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientVisitRepository extends JpaRepository<PatientVisit, UUID> {
    List<PatientVisit> findByPatientPatientIdOrderByVisitTimestampDesc(UUID patientId);

    Optional<PatientVisit> findTopByPatientPatientIdAndVisitTimestampBetweenOrderByVisitTimestampDesc(
            UUID patientId, LocalDateTime startOfDay, LocalDateTime endOfDay);
}
