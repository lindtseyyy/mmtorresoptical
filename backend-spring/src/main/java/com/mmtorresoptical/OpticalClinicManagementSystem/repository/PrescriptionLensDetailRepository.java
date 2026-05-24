package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionLensDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PrescriptionLensDetailRepository extends JpaRepository<PrescriptionLensDetail, UUID> {

    @Modifying
    @Query("DELETE FROM PrescriptionLensDetail d WHERE d.prescription.prescriptionId = :prescriptionId")
    void deleteAllByPrescriptionId(@Param("prescriptionId") UUID prescriptionId);
}
