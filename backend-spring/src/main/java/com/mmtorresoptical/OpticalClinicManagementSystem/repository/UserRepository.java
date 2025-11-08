package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    // For finding users for the ManageUsers page
    List<User> findAllByIsArchivedFalse();

    // For checking conflicts during registration
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    // For login
    Optional<User> findByUsernameOrEmail(String username, String email);
}