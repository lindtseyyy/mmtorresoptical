package com.mmtorresoptical.OpticalClinicManagementSystem.converter;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.LensType;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.AesEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AesLensTypeConverter
        implements AttributeConverter<LensType, String> {

    private final AesEncryptionService encryptionService =
            new AesEncryptionService();

    @Override
    public String convertToDatabaseColumn(LensType attribute) {
        if (attribute == null) return null;
        return encryptionService.encrypt(attribute.toString());
    }

    @Override
    public LensType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return LensType.valueOf(
                encryptionService.decrypt(dbData));
    }
}