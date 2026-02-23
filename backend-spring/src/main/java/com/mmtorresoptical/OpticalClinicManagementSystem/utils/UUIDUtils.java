package com.mmtorresoptical.OpticalClinicManagementSystem.utils;

import java.util.UUID;

public class UUIDUtils {

    public static boolean isUUID(String keyword) {
        try {
            UUID.fromString(keyword);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}