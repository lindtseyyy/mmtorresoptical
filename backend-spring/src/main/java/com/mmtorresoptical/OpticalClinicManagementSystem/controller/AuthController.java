package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.LoginRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.LoginResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.JwtTokenProvider;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequestDTO loginRequest) {

        // 1. Find user by username or email
        String identifier = loginRequest.getLoginIdentifier();
        Optional<User> userOptional = userRepository.findByUsernameOrEmail(identifier, identifier);

        // 2. Check if user exists and if password matches
        if (userOptional.isEmpty()) {
            // User not found
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        User user = userOptional.get();
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            // Password does not match
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        // 3. If yes, generate a JWT token
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getUserId());

        // 4. Return the token in a DTO
        return ResponseEntity.ok(new LoginResponseDTO(token));
    }
}