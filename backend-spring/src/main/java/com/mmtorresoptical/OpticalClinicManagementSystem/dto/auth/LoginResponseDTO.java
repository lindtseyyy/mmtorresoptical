package com.mmtorresoptical.OpticalClinicManagementSystem.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String accessToken;
    private String tokenType = "Bearer";
    @JsonProperty("isPwChangeRequired")
    private boolean isPwChangeRequired;

    public LoginResponseDTO(String accessToken, boolean isPwChangeRequired) {
        this.accessToken = accessToken;
        this.isPwChangeRequired = isPwChangeRequired;
    }
}