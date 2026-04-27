package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.ForgotPasswordQuestionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.LoginRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.LoginResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.MessageResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.PasswordResetRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.SecurityQuestionResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.VerifySecurityAnswerRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
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

    @PostMapping("/forgot-password/question")
    public ResponseEntity<?> fetchSecurityQuestion(@Valid @RequestBody ForgotPasswordQuestionRequestDTO request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        if (userOptional.isEmpty()) {
            return ResponseEntity.ok(new MessageResponseDTO("If the email is registered, a security question will be provided."));
        }

        User user = userOptional.get();
        return ResponseEntity.ok(new SecurityQuestionResponseDTO(user.getSecurityQuestion()));
    }

    @PostMapping("/forgot-password/verify")
    public ResponseEntity<MessageResponseDTO> verifySecurityAnswer(@Valid @RequestBody VerifySecurityAnswerRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or security answer"));

        if (!passwordEncoder.matches(request.getSecurityAnswer(), user.getSecurityAnswerHash())) {
            throw new BadRequestException("Invalid email or security answer");
        }

        return ResponseEntity.ok(new MessageResponseDTO("Security answer verified"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<MessageResponseDTO> resetPassword(@Valid @RequestBody PasswordResetRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or security answer"));

        if (!passwordEncoder.matches(request.getSecurityAnswer(), user.getSecurityAnswerHash())) {
            throw new BadRequestException("Invalid email or security answer");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponseDTO("Password reset successfully"));
    }
}