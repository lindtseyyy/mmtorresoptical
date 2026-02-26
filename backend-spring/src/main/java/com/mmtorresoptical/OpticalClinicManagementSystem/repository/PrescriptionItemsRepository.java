package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface PrescriptionItemsRepository extends JpaRepository<PrescriptionItem, UUID>, JpaSpecificationExecutor<PrescriptionItem> {

}

