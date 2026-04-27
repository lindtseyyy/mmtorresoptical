package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.ResetSecurityCredentialsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.SecurityCredentialsUpdateResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UpdateSecurityCredentialsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class UserSecurityController {

    private final UserService userService;

    @PatchMapping("/users/me/security-question")
    public ResponseEntity<SecurityCredentialsUpdateResponseDTO> updateOwnSecurityCredentials(
            @Valid @RequestBody UpdateSecurityCredentialsRequestDTO request) {

        SecurityCredentialsUpdateResponseDTO response = userService.updateOwnSecurityCredentials(request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/admin/users/{id}/security-credentials")
    public ResponseEntity<SecurityCredentialsUpdateResponseDTO> resetSecurityCredentials(
            @PathVariable UUID id,
            @Valid @RequestBody ResetSecurityCredentialsRequestDTO request) {

        SecurityCredentialsUpdateResponseDTO response = userService.resetSecurityCredentials(id, request);
        return ResponseEntity.ok(response);
    }
}
