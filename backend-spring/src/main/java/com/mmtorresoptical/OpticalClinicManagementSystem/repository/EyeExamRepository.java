package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.UUID;

public interface EyeExamRepository extends JpaRepository<EyeExam, UUID>, JpaSpecificationExecutor<EyeExam> {

    @Query("SELECT MAX(e.createdAt) FROM EyeExam e WHERE e.patient.patientId = :patientId AND e.status = 'ACTIVE'")
    LocalDateTime findMaxCreatedAtByPatientId(UUID patientId);
}
