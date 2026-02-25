package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.UUID;

public class PatientSpecification {
    public static Specification<Patient> nameContains(String keyword) {
        return (root, query, cb) ->
                cb.like(
                        cb.lower(root.get("fullNameSortable")),
                        "%" + keyword.toLowerCase() + "%"
                );
    }

    public static Specification<Patient> hasId(UUID patientId) {
        return (root, query, cb) ->
                cb.equal(root.get("patientId"), patientId);
    }

    public static Specification<Patient> hasArchivedStatus(String status) {
        return (root, query, cb) -> {

            if (status == null || status.equalsIgnoreCase("ALL")) {
                return cb.conjunction(); // no filtering
            }

            if (status.equalsIgnoreCase("ARCHIVED")) {
                return cb.isTrue(root.get("isArchived"));
            }

            // default ACTIVE
            return cb.isFalse(root.get("isArchived"));
        };
    }
}
