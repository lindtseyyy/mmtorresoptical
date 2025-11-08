package com.mmtorresoptical.OpticalClinicManagementSystem.dto;

public class LoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";

    public LoginResponse(String accessToken) {
        this.accessToken = accessToken;
    }

    // Getters
    public String getAccessToken() {
        return accessToken;
    }
    public String getTokenType() {
        return tokenType;
    }
    // Setters
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }
}