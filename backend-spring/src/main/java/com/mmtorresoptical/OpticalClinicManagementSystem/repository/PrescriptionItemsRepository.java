package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PrescriptionItemsRepository extends JpaRepository<PrescriptionItem, UUID>{

    Page<PrescriptionItem> findAllByIsArchivedFalseAndPrescription_PrescriptionId(UUID id, Pageable pageable);
    Page<PrescriptionItem> findAllByIsArchivedTrueAndPrescription_PrescriptionId(UUID id, Pageable pageable);
    Page<PrescriptionItem> findAllByPrescription_PrescriptionId(UUID id, Pageable pageable);
}

