package com.mmtorresoptical.OpticalClinicManagementSystem.converter;

import com.mmtorresoptical.OpticalClinicManagementSystem.security.AesEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AesIntegerConverter
        implements AttributeConverter<Integer, String> {

    private final AesEncryptionService encryptionService =
            new AesEncryptionService();

    @Override
    public String convertToDatabaseColumn(Integer attribute) {
        if (attribute == null) return null;
        return encryptionService.encrypt(attribute.toString());
    }

    @Override
    public Integer convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return Integer.valueOf(
                encryptionService.decrypt(dbData));
    }
}

