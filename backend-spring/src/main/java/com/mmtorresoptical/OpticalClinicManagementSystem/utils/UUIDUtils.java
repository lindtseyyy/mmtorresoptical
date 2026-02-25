package com.mmtorresoptical.OpticalClinicManagementSystem.utils;

import java.util.UUID;

public class UUIDUtils {

    private UUIDUtils() {
        throw new UnsupportedOperationException(
                "Utility class cannot be instantiated");
    }

    public static boolean isUUID(String keyword) {
        try {
            UUID.fromString(keyword);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}