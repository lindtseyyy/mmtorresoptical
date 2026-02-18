package com.mmtorresoptical.OpticalClinicManagementSystem.converter;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.EyeSide;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.AesEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AesEyeSideConverter
        implements AttributeConverter<EyeSide, String> {

    private final AesEncryptionService encryptionService =
            new AesEncryptionService();

    @Override
    public String convertToDatabaseColumn(EyeSide attribute) {
        if (attribute == null) return null;
        return encryptionService.encrypt(attribute.toString());
    }

    @Override
    public EyeSide convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return EyeSide.valueOf(
                encryptionService.decrypt(dbData));
    }
}