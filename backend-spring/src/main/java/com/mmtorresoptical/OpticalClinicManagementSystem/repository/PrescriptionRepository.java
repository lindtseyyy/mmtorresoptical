package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    Page<Prescription> findAllByIsArchivedFalseAndPatient_PatientId(UUID id, Pageable pageable);
    Page<Prescription> findAllByIsArchivedTrueAndPatient_PatientId(UUID id, Pageable pageable);
    Page<Prescription> findAllByPatient_PatientId(UUID id, Pageable pageable);
}
