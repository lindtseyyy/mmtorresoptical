package com.mmtorresoptical.OpticalClinicManagementSystem.repository;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Page<User> findAllByIsArchivedFalse(Pageable pageable);
    Page<User> findAllByIsArchivedTrue(Pageable pageable);

    // For checking conflicts during registration
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    // For login
    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByFirstNameAndMiddleNameAndLastName(String firstName, String middleName, String lastName);
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.email = :email")
    Boolean existsByEmail(@Param("email") String email);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.contactNumber = :contactNumber")
    Boolean existsByContactNumber(@Param("contactNumber") String contactNumber);
    Boolean existsByUsername(String userName);

    // Summary counts
    long countByIsArchivedFalse();
    long countByIsArchivedTrue();

    @Query("SELECT COUNT(u) FROM User u WHERE u.isArchived = false AND u.role = 'ADMIN'")
    long countActiveAdmins();

    @Query("SELECT COUNT(u) FROM User u WHERE u.isArchived = false AND u.role = 'STAFF'")
    long countActiveStaff();

    @Query("SELECT u FROM User u WHERE u.isArchived = false AND " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.middleName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findAllByIsArchivedFalseWithKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.isArchived = true AND " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.middleName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findAllByIsArchivedTrueWithKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.middleName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findAllWithKeyword(@Param("keyword") String keyword, Pageable pageable);
}