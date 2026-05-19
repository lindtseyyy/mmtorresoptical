package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface EyeExamRepository extends JpaRepository<EyeExam, UUID>, JpaSpecificationExecutor<EyeExam> {
}
