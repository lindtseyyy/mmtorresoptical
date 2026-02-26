package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class PrescriptionSpecification {

    public static Specification<Prescription> hasPatientId(UUID patientId) {
        return (root, query, cb) ->
                cb.equal(root.get("patient").get("patientId"), patientId);
    }

    public static Specification<Prescription> hasArchivedStatus(String status) {
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

    public static Specification<Prescription> dateBetween(LocalDate minDate, LocalDate maxDate) {
        return (root, query, cb) -> {

            if (minDate == null && maxDate == null) {
                return cb.conjunction();
            }

            LocalDateTime start = null;
            LocalDateTime end = null;

            if (minDate != null) {
                start = minDate.atStartOfDay();
            }

            if (maxDate != null) {
                end = maxDate.atTime(23, 59, 59);
            }

            if (start != null && end != null) {
                return cb.between(
                        root.get("examDate"),
                        start,
                        end
                );
            }

            if (start != null) {
                return cb.greaterThanOrEqualTo(
                        root.get("examDate"),
                        start
                );
            }

            return cb.lessThanOrEqualTo(
                    root.get("examDate"),
                    end
            );
        };
    }
}
