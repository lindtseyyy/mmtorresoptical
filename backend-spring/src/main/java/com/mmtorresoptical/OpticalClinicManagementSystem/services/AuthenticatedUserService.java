package com.mmtorresoptical.OpticalClinicManagementSystem.services;

import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthenticatedUserService {
    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        CustomUserDetails principal =
                (CustomUserDetails) auth.getPrincipal();

        UUID userId = principal.getUserId();

        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );
    }

    public UUID getCurrentUserId() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        CustomUserDetails principal =
                (CustomUserDetails) auth.getPrincipal();

        return principal.getUserId();
    }
}
