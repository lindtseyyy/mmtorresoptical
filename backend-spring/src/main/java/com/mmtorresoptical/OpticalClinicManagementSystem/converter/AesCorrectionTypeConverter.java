package com.mmtorresoptical.OpticalClinicManagementSystem.converter;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.CorrectionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.AesEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AesCorrectionTypeConverter
        implements AttributeConverter<CorrectionType, String> {

    private final AesEncryptionService encryptionService =
            new AesEncryptionService();

    @Override
    public String convertToDatabaseColumn(CorrectionType attribute) {
        if (attribute == null) return null;
        return encryptionService.encrypt(attribute.toString());
    }

    @Override
    public CorrectionType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return CorrectionType.valueOf(
                encryptionService.decrypt(dbData));
    }
}