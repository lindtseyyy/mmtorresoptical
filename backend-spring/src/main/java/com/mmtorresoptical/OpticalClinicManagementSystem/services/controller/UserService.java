package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.UserSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UpdateSecurityCredentialsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.ResetSecurityCredentialsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.SecurityCredentialsUpdateResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UpdateUserRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UpdateOwnProfileRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.CreateUserRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ConflictException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.UserMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.UserAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.NameUtils;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final UserAuditHelper userAuditHelper;
    private final AuthenticatedUserService authenticatedUserService;

    public UserResponseDTO createUser(CreateUserRequestDTO userRequest) {
        // 1. Check if username or email or contact number already exists
        if (userRepository.existsByUsername(userRequest.getUsername())) {
            // This String body is now allowed
            throw new ConflictException("Username is already taken");
        }
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            // This String body is now allowed
            throw new ConflictException("Email is already in use");
        }
        if (userRepository.existsByContactNumber(userRequest.getContactNumber())) {
            // This String body is now allowed
            throw new ConflictException("Contact number is already in use");
        }

        User user = userMapper.requestDTOtoEntity(userRequest);
        user.setFullNameSortable(NameUtils.generateFullNameSortable(userRequest.getFirstName(), userRequest.getMiddleName(), userRequest.getLastName()));

        if (userRequest.getPassword() == null || userRequest.getPassword().isBlank()) {
            throw new ConflictException("Password is required for new users");
        }
        user.setPasswordHash(passwordEncoder.encode(userRequest.getPassword()));

        User savedUser = userRepository.save(user);

        // Audit Logging
        userAuditHelper.logCreate(savedUser);

        return userMapper.entityToResponseDTO(savedUser);
    }

    public Page<UserDetailsDTO> getAllUsers(int page,
                                            int size,
                                            String sortBy,
                                            String sortOrder,
                                            String archivedStatus,
                                            String keyword,
                                            String role,
                                            String sex) {

        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            direction = Sort.Direction.DESC;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Archived status filter
            switch (archivedStatus.toUpperCase()) {
                case "ARCHIVED" -> predicates.add(cb.isTrue(root.get("isArchived")));
                case "ALL" -> { /* no filter */ }
                default -> predicates.add(cb.isFalse(root.get("isArchived")));
            }

            // Keyword search across name, username, and email
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("middleName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("username")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern)
                ));
            }

            // Role filter
            if (role != null && !role.isBlank()) {
                predicates.add(cb.equal(root.get("role").as(String.class), role.toUpperCase()));
            }

            // Sex filter
            if (sex != null && !sex.isBlank()) {
                predicates.add(cb.equal(root.get("sex").as(String.class), sex.toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> users = userRepository.findAll(spec, pageable);
        return users.map(userMapper::entityToDetailsDTO);
    }

    public UserDetailsDTO getUser(UUID id) {
        // Retrieve prescription or throw exception if not found
        User retrievedUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        return userMapper.entityToDetailsDTO(retrievedUser);
    }

    public UserDetailsDTO updateUser(UUID id, UpdateUserRequestDTO userRequest) {

        User retrievedUser = getUserById(id);

        // Create a copy for logging (BEFORE snapshot)
        User beforeUpdate = new User();
        BeanUtils.copyProperties(retrievedUser, beforeUpdate);

        /* -----------------------------
           Normalize input values
        ----------------------------- */
        String first = userRequest.getFirstName();
        String middle = Optional.ofNullable(userRequest.getMiddleName()).orElse("");
        String last = userRequest.getLastName();

        /* -----------------------------
           Validate name uniqueness
        ----------------------------- */
        boolean nameChanged =
                !retrievedUser.getFirstName().equals(first) ||
                        !Objects.equals(retrievedUser.getMiddleName(), middle)
                        ||
                        !retrievedUser.getLastName().equals(last);

        if (nameChanged) {

            boolean isNameExisting = userRepository.existsByFirstNameAndMiddleNameAndLastName(first, middle, last);

            if(isNameExisting) {
                throw new ConflictException("Name is already taken");
            }

            retrievedUser.setFullNameSortable(NameUtils.generateFullNameSortable(first, middle, last));

        }

        /* -----------------------------
           Validate email uniqueness
        ----------------------------- */
        if(!retrievedUser.getEmail().equals(userRequest.getEmail())) {

            boolean isEmailExisting = userRepository.existsByEmail(userRequest.getEmail());

            if (isEmailExisting) {
                throw new ConflictException("Email is already in use");
            }

        }

        /* -----------------------------
           Validate contact number uniqueness
        ----------------------------- */
        if(!retrievedUser.getContactNumber().equals(userRequest.getContactNumber())) {

            boolean isContactExisting = userRepository.existsByContactNumber(userRequest.getContactNumber());

            if (isContactExisting) {
                throw new ConflictException("Contact number is already in use");
            }

        }

        userMapper.updateEntityFromRequestDTO(userRequest, retrievedUser);

        User updatedUser = userRepository.save(retrievedUser);

        // Audit Logging
        userAuditHelper.logUpdate(beforeUpdate, updatedUser);

        return userMapper.entityToDetailsDTO(updatedUser);
    }

    public SecurityCredentialsUpdateResponseDTO updateOwnSecurityCredentials(UpdateSecurityCredentialsRequestDTO request) {
        User retrievedUser = authenticatedUserService.getCurrentUser();
        validateCurrentPassword(retrievedUser, request.getCurrentPassword());

        User beforeUpdate = new User();
        BeanUtils.copyProperties(retrievedUser, beforeUpdate);

        retrievedUser.setSecurityQuestion(request.getSecurityQuestion());
        retrievedUser.setSecurityAnswerHash(passwordEncoder.encode(request.getSecurityAnswer()));

        User updatedUser = userRepository.save(retrievedUser);
        userAuditHelper.logUpdate(beforeUpdate, updatedUser);

        SecurityCredentialsUpdateResponseDTO response = new SecurityCredentialsUpdateResponseDTO();
        response.setMessage("Security credentials updated successfully.");
        response.setSecurityQuestion(updatedUser.getSecurityQuestion());
        return response;
    }

    public SecurityCredentialsUpdateResponseDTO resetSecurityCredentials(UUID id, ResetSecurityCredentialsRequestDTO request) {
        User retrievedUser = getUserById(id);

        User beforeUpdate = new User();
        BeanUtils.copyProperties(retrievedUser, beforeUpdate);

        retrievedUser.setSecurityQuestion(request.getNewSecurityQuestion());
        retrievedUser.setSecurityAnswerHash(passwordEncoder.encode(request.getNewSecurityAnswer()));

        User updatedUser = userRepository.save(retrievedUser);
        userAuditHelper.logUpdate(beforeUpdate, updatedUser);

        SecurityCredentialsUpdateResponseDTO response = new SecurityCredentialsUpdateResponseDTO();
        response.setMessage("Security credentials reset successfully.");
        response.setSecurityQuestion(updatedUser.getSecurityQuestion());
        return response;
    }

    private void validateCurrentPassword(User user, String currentPassword) {
        if (currentPassword == null || currentPassword.isBlank() || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Invalid current password");
        }
    }

    public UserSummaryDTO getUserSummary() {
        long activeUsers = userRepository.countByIsArchivedFalse();
        long archivedUsers = userRepository.countByIsArchivedTrue();
        long adminUsers = userRepository.countActiveAdmins();
        long staffUsers = userRepository.countActiveStaff();

        return new UserSummaryDTO(
                activeUsers + archivedUsers,
                activeUsers,
                archivedUsers,
                adminUsers,
                staffUsers
        );
    }

    public void archiveUser(UUID id) {

        User retrievedUser = getUserById(id);

        retrievedUser.setIsArchived(true);

        userRepository.save(retrievedUser);

        // Audit Logging
        userAuditHelper.logArchive(retrievedUser);
    }

    public void restoreUser(UUID id) {

        User retrievedUser = getUserById(id);

        retrievedUser.setIsArchived(false);

        userRepository.save(retrievedUser);

        // Audit Logging
        userAuditHelper.logRestore(retrievedUser);
    }

    public UserResponseDTO getOwnProfile() {
        User user = authenticatedUserService.getCurrentUser();
        return userMapper.entityToResponseDTO(user);
    }

    public UserResponseDTO updateOwnProfile(UpdateOwnProfileRequestDTO request) {
        User user = authenticatedUserService.getCurrentUser();

        User beforeUpdate = new User();
        BeanUtils.copyProperties(user, beforeUpdate);

        String first = request.getFirstName();
        String middle = Optional.ofNullable(request.getMiddleName()).orElse("");
        String last = request.getLastName();

        boolean nameChanged =
                !user.getFirstName().equals(first) ||
                        !Objects.equals(user.getMiddleName(), middle) ||
                        !user.getLastName().equals(last);

        if (nameChanged) {
            if (userRepository.existsByFirstNameAndMiddleNameAndLastName(first, middle, last)) {
                throw new ConflictException("Name is already taken");
            }
            user.setFullNameSortable(NameUtils.generateFullNameSortable(first, middle, last));
        }

        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email is already in use");
            }
        }

        if (!user.getContactNumber().equals(request.getContactNumber())) {
            if (userRepository.existsByContactNumber(request.getContactNumber())) {
                throw new ConflictException("Contact number is already in use");
            }
        }

        userMapper.updateEntityFromOwnProfileRequestDTO(request, user);

        User updatedUser = userRepository.save(user);
        userAuditHelper.logUpdate(beforeUpdate, updatedUser);

        return userMapper.entityToResponseDTO(updatedUser);
    }

    private User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}