package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.EyeExam;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public class EyeExamSpecification {

    public static Specification<EyeExam> hasPatientId(UUID patientId) {
        return (Root<EyeExam> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Join<EyeExam, Patient> patientJoin = root.join("patient");
            return cb.equal(patientJoin.get("patientId"), patientId);
        };
    }

    public static Specification<EyeExam> hasArchivedStatus(String archivedStatus) {
        return (Root<EyeExam> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (archivedStatus == null || archivedStatus.equalsIgnoreCase("ALL")) {
                return cb.conjunction();
            }
            boolean isArchived = archivedStatus.equalsIgnoreCase("ARCHIVED");
            return cb.equal(root.get("isArchived"), isArchived);
        };
    }

    public static Specification<EyeExam> dateBetween(LocalDate minDate, LocalDate maxDate) {
        return (Root<EyeExam> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Path<LocalDateTime> createdAtPath = root.get("createdAt");
            if (minDate != null && maxDate != null) {
                return cb.between(createdAtPath,
                        minDate.atStartOfDay(),
                        maxDate.atTime(LocalTime.MAX));
            } else if (minDate != null) {
                return cb.greaterThanOrEqualTo(createdAtPath, minDate.atStartOfDay());
            } else if (maxDate != null) {
                return cb.lessThanOrEqualTo(createdAtPath, maxDate.atTime(LocalTime.MAX));
            }
            return cb.conjunction();
        };
    }
}
