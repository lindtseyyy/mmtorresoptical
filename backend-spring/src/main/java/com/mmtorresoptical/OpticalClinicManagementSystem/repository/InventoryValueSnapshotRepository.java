package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.InventoryValueSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryValueSnapshotRepository extends JpaRepository<InventoryValueSnapshot, UUID> {
    List<InventoryValueSnapshot> findBySnapshotDateBetweenOrderBySnapshotDateAsc(LocalDate start, LocalDate end);
}
