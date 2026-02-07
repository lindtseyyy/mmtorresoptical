package com.mmtorresoptical.OpticalClinicManagementSystem.converter;

import com.mmtorresoptical.OpticalClinicManagementSystem.security.AesEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AesEncryptionConverter implements AttributeConverter<String, String> {

    private final AesEncryptionService encryptionService =
            new AesEncryptionService();

    // Convert Entity → Database
    @Override
    public String convertToDatabaseColumn(String attribute) {

        if (attribute == null) return null;

        return encryptionService.encrypt(attribute);
    }

    // Convert Database → Entity
    @Override
    public String convertToEntityAttribute(String dbData) {

        if (dbData == null) return null;

        return encryptionService.decrypt(dbData);
    }
}

