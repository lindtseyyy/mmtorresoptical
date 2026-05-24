package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PrescriptionRecommendationRepository extends JpaRepository<PrescriptionRecommendation, UUID> {

    @Query("SELECT r FROM PrescriptionRecommendation r JOIN FETCH r.product WHERE r.prescription.prescriptionId = :prescriptionId")
    List<PrescriptionRecommendation> findAllByPrescriptionId(@Param("prescriptionId") UUID prescriptionId);

    @Modifying
    @Query("DELETE FROM PrescriptionRecommendation r WHERE r.prescription.prescriptionId = :prescriptionId")
    void deleteAllByPrescriptionId(@Param("prescriptionId") UUID prescriptionId);
}
