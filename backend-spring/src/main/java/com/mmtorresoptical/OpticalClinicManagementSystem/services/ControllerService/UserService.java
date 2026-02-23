package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UpdateUserRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.CreateUserRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ConflictException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.UserMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.NameUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

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
            throw new ConflictException("Email is already in use");
        }

        User user = userMapper.requestDTOtoEntity(userRequest);
        user.setFullNameSortable(NameUtils.generateFullNameSortable(userRequest.getFirstName(), userRequest.getMiddleName(), userRequest.getLastName()));

        if (userRequest.getPassword() == null || userRequest.getPassword().isBlank()) {
            throw new ConflictException("Password is required for new users");
        }
        user.setPasswordHash(passwordEncoder.encode(userRequest.getPassword()));

        User savedUser = userRepository.save(user);

        return userMapper.entityToResponseDTO(savedUser);
    }

    public Page<UserDetailsDTO> getAllUsers(int page,
                                            int size,
                                            String sortBy,
                                            String sortOrder,
                                            String archivedStatus) {

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // Retrieve non-archived patients
        Page<User> users = switch (archivedStatus.toUpperCase()) {
            case "ARCHIVED" -> userRepository.findAllByIsArchivedTrue(pageable);
            case "ALL" -> userRepository.findAll(pageable);
            default -> // ACTIVE
                    userRepository.findAllByIsArchivedFalse(pageable);
        };

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

        return userMapper.entityToDetailsDTO(updatedUser);
    }

    public void archiveUser(UUID id) {

        User retrievedUser = getUserById(id);

        retrievedUser.setIsArchived(true);

        userRepository.save(retrievedUser);
    }

    public void restoreUser(UUID id) {

        User retrievedUser = getUserById(id);

        retrievedUser.setIsArchived(false);

        userRepository.save(retrievedUser);
    }

    private User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}