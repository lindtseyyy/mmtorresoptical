package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HealthHistoryRepository extends JpaRepository<HealthHistory, UUID> {

    // For finding patient health history that are not archived
    Page<HealthHistory> findAllByIsArchivedFalseAndPatient_PatientId(UUID patientId, Pageable pageable);

    Page<HealthHistory> findAllByIsArchivedTrueAndPatient_PatientId(UUID patientId, Pageable pageable);
}
