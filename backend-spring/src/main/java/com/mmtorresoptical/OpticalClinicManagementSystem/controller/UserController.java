package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.CreateUserRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UpdateUserRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/users")
public class UserController {

    private final UserService userService;

    /**
     * CREATE a new user
     * Change return type from ResponseEntity<?> to ResponseEntity<Object>
     */
    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody CreateUserRequestDTO userRequest) {
        UserResponseDTO userResponseDTO = userService.createUser(userRequest);

        // This User object body is also allowed
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponseDTO);
    }

    /**
     * READ all non-archived users
     * (No change needed here, but ResponseEntity<List<User>> is fine)
     */
    @GetMapping
    public ResponseEntity<Page<UserDetailsDTO>> getAllUsers(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size,
                                                  @RequestParam(defaultValue = "fullNameSortable") String sortBy,
                                                  @RequestParam(defaultValue = "asc") String sortOrder,
                                                  @RequestParam(defaultValue = "ACTIVE") String archivedStatus) {

        Page<UserDetailsDTO> userDetailsDTOPage = userService.getAllUsers(page, size, sortBy, sortOrder, archivedStatus);

        return ResponseEntity.ok(userDetailsDTOPage);
    }

    /**
     * READ a single user by ID
     * (No change needed here)
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDetailsDTO> getUserById(@PathVariable UUID id) {
        UserDetailsDTO user = userService.getUser(id);

        return ResponseEntity.ok(user);
    }

    /**
     * UPDATE an existing user
     * Change return type from ResponseEntity<User> to ResponseEntity<Object>
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserDetailsDTO> updateUser(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequestDTO userRequest) {

        UserDetailsDTO userDetailsDTO = userService.updateUser(id, userRequest);

        return ResponseEntity.ok(userDetailsDTO);
    }

    /**
     * ARCHIVE a user (Soft Delete)
     * (No change needed, but ResponseEntity<Void> is standard)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveUser(@PathVariable UUID id) {
        userService.archiveUser(id);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restoreUser(@PathVariable UUID id) {
        userService.restoreUser(id);

        return ResponseEntity.noContent().build();
    }
}