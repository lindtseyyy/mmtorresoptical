package com.mmtorresoptical.OpticalClinicManagementSystem.utils;

public class NameUtils {

    /**
     * Generates a normalized full name string for sorting and search operations.
     *
     * This method:
     * - Combines first, middle, and last names
     * - Handles nullable middle names
     * - Removes extra whitespace
     * - Converts the result to uppercase
     *
     * The output is used for consistent sorting and
     * case-insensitive searching.
     *
     * @param firstName the patient's first name
     * @param middleName the patient's middle name (nullable)
     * @param lastName the patient's last name
     * @return a normalized sortable full name, or null if required fields are missing
     */
    public static String generateFullNameSortable(
            String firstName,
            String middleName,
            String lastName
    ) {
        if (firstName == null || lastName == null) {
            return null;
        }

        String fullName =
                firstName + " " +
                        (middleName != null ? middleName : "") + " " +
                        lastName;

        return fullName
                .trim()
                .replaceAll("\\s+", " ")
                .toUpperCase();
    }
}
