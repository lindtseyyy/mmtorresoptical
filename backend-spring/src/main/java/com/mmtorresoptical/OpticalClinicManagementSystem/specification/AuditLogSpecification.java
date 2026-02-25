package com.mmtorresoptical.OpticalClinicManagementSystem.specification;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.AuditLog;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class AuditLogSpecification {

    public static Specification<AuditLog> hasActionType(ActionType actionType) {
        return (root, query, cb) ->
                cb.equal(root.get("actionType"), actionType);
    }

    public static Specification<AuditLog> hasResourceType(ResourceType resourceType) {
        return (root, query, cb) ->
                cb.equal(root.get("resourceType"), resourceType);
    }

    public static Specification<AuditLog> hasResourceId(UUID resourceId) {
        return (root, query, cb) ->
                cb.equal(root.get("resourceId"), resourceId);
    }

    public static Specification<AuditLog> hasUserId(UUID userId) {
        return (root, query, cb) ->
                cb.equal(root.get("userId"), userId);
    }

    public static Specification<AuditLog> dateBetween(LocalDate minDate, LocalDate maxDate) {
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
                        root.get("loggedAt"),
                        start,
                        end
                );
            }

            if (start != null) {
                return cb.greaterThanOrEqualTo(
                        root.get("loggedAt"),
                        start
                );
            }

            return cb.lessThanOrEqualTo(
                    root.get("loggedAt"),
                    end
            );
        };
    }
}
