package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.UUID;

public interface PrescriptionRepository extends JpaRepository<Prescription, UUID>, JpaSpecificationExecutor<Prescription> {

    @Query("SELECT MAX(p.issueDate) FROM Prescription p WHERE p.patient.patientId = :patientId AND p.isArchived = false")
    LocalDate findMaxIssueDateByPatientId(UUID patientId);
}
