package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Role;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * CREATE a new user
     * Change return type from ResponseEntity<?> to ResponseEntity<Object>
     */
    @PostMapping
    public ResponseEntity<Object> createUser(@Valid @RequestBody UserRequestDTO userRequest) {
        // 1. Check if username or email already exists
        if (userRepository.findByUsername(userRequest.getUsername()).isPresent()) {
            // This String body is now allowed
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username is already taken");
        }
        if (userRepository.findByEmail(userRequest.getEmail()).isPresent()) {
            // This String body is now allowed
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already in use");
        }

        User user = new User();
        mapDtoToEntity(user, userRequest);

        if (userRequest.getPassword() == null || userRequest.getPassword().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password is required for new users");
        }
        user.setPasswordHash(passwordEncoder.encode(userRequest.getPassword()));

        User savedUser = userRepository.save(user);

        // This User object body is also allowed
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    /**
     * READ all non-archived users
     * (No change needed here, but ResponseEntity<List<User>> is fine)
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAllByIsArchivedFalse();
        return ResponseEntity.ok(users);
    }

    /**
     * READ a single user by ID
     * (No change needed here)
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return ResponseEntity.ok(user);
    }

    /**
     * UPDATE an existing user
     * Change return type from ResponseEntity<User> to ResponseEntity<Object>
     */
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateUser(@PathVariable UUID id, @Valid @RequestBody UserRequestDTO userRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Check for conflicts
        if (!user.getUsername().equals(userRequest.getUsername()) && userRepository.findByUsername(userRequest.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username is already taken");
        }
        if (!user.getEmail().equals(userRequest.getEmail()) && userRepository.findByEmail(userRequest.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already in use");
        }

        mapDtoToEntity(user, userRequest);

        if (userRequest.getPassword() != null && !userRequest.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(userRequest.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * ARCHIVE a user (Soft Delete)
     * (No change needed, but ResponseEntity<Void> is standard)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsArchived(true);
        userRepository.save(user);

        return ResponseEntity.noContent().build();
    }


    /**
     * Helper method to map DTO fields to the User entity
     */
    private void mapDtoToEntity(User user, UserRequestDTO userRequest) {
        user.setFirstName(userRequest.getFirstName());
        user.setMiddleName(userRequest.getMiddleName());
        user.setLastName(userRequest.getLastName());
        user.setGender(Gender.valueOf(userRequest.getGender()));
        user.setBirthDate(userRequest.getBirthDate());
        user.setEmail(userRequest.getEmail());
        user.setContactNumber(userRequest.getContactNumber());
        user.setUsername(userRequest.getUsername());
        user.setRole(Role.valueOf(userRequest.getRole()));
        user.setIsArchived(userRequest.getIsArchived());
    }
}