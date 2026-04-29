package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID>, JpaSpecificationExecutor<Patient> {
    // For finding patients
    Page<Patient> findAllByIsArchivedFalse(Pageable pageable);

    Page<Patient> findAllByFullNameSortableContainingIgnoreCase(String keyword, Pageable pageable);

    Optional<Patient> findPatientByFirstNameAndMiddleNameAndLastName(String firstName, String middleName,String lastName);
    Optional<Patient> findPatientByEmail(String email);

    Boolean existsByFirstNameHashAndMiddleNameHashAndLastNameHash(String firstNameHash, String middleNameHash,String lastNameHash);
    Boolean existsByEmailHash(String emailHash);

    // Aggregation queries for reports
    long countByIsArchived(boolean archived);

    long countByGender(Gender gender);

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.createdAt >= :start AND p.createdAt < :end")
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM Patient p WHERE p.isArchived = false")
    List<Patient> findAllActive();
}
