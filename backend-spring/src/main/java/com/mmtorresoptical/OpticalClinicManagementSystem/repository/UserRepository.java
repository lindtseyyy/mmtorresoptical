package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {


    Page<User> findAllByIsArchivedFalse(Pageable pageable);
    Page<User> findAllByIsArchivedTrue(Pageable pageable);

    // For checking conflicts during registration
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    // For login
    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByFirstNameAndMiddleNameAndLastName(String firstName, String middleName, String lastName);
    Boolean existsByEmail(String email);
    Boolean existsByContactNumber(String contactNumber);
    Boolean existsByUsername(String userName);
}