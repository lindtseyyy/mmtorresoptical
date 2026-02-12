package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    // For finding patients
    Page<Patient> findAllByIsArchivedFalse(Pageable pageable);

    Page<Patient> findAllByFullNameSortableContainingIgnoreCase(String keyword, Pageable pageable);

    Optional<Patient> findPatientByFirstNameAndMiddleNameAndLastName(String firstName, String middleName,String lastName);
    Optional<Patient> findPatientByEmail(String email);

    Boolean existsByFirstNameHashAndMiddleNameHashAndLastNameHash(String firstNameHash, String middleNameHash,String lastNameHash);
}
