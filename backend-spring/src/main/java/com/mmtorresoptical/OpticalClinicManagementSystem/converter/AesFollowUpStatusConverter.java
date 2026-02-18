package com.mmtorresoptical.OpticalClinicManagementSystem.converter;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.AesEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AesFollowUpStatusConverter
        implements AttributeConverter<FollowUpStatus, String> {

    private final AesEncryptionService encryptionService =
            new AesEncryptionService();

    @Override
    public String convertToDatabaseColumn(FollowUpStatus attribute) {
        if (attribute == null) return null;
        return encryptionService.encrypt(attribute.toString());
    }

    @Override
    public FollowUpStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return FollowUpStatus.valueOf(
                encryptionService.decrypt(dbData));
    }
}