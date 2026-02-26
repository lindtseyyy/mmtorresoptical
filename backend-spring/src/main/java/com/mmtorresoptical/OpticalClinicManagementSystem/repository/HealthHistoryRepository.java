package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface HealthHistoryRepository extends JpaRepository<HealthHistory, UUID>, JpaSpecificationExecutor<HealthHistory> {

}
