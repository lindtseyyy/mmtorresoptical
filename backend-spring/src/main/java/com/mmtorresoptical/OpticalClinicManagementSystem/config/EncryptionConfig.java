package com.mmtorresoptical.OpticalClinicManagementSystem.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EncryptionConfig {

    public static String SECRET_KEY;

    @Value("${encryption.secret-key}")
    private void setSecretKey(String key) {
        SECRET_KEY = key;
    }
}

