package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    // For finding patients
    List<Patient> findAllByIsArchivedFalse();

    Optional<Patient> findPatientByFirstNameAndMiddleNameAndLastName(String firstName, String middleName,String lastName);

    Boolean existsByFirstNameHashAndMiddleNameHashAndLastNameHash(String firstNameHash, String middleNameHash,String lastNameHash);
}
