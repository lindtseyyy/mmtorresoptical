package com.mmtorresoptical.OpticalClinicManagementSystem.validation;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ProductRequestValidator
        implements ConstraintValidator<ValidProductRequest, ProductRequest> {

    @Override
    public boolean isValid(ProductRequest dto, ConstraintValidatorContext context) {
        if (dto.getProductType() != ProductType.PHYSICAL) {
            return true;
        }

        boolean valid = true;
        context.disableDefaultConstraintViolation();

        if (dto.getSupplierId() == null
                && (dto.getNewSupplierName() == null || dto.getNewSupplierName().trim().isEmpty())) {
            context.buildConstraintViolationWithTemplate("Supplier is required")
                    .addPropertyNode("supplierId")
                    .addConstraintViolation();
            valid = false;
        }

        if (dto.getLowLevelThreshold() == null) {
            context.buildConstraintViolationWithTemplate("Low stock threshold is required")
                    .addPropertyNode("lowLevelThreshold")
                    .addConstraintViolation();
            valid = false;
        } else if (dto.getLowLevelThreshold() < 0) {
            context.buildConstraintViolationWithTemplate("Threshold cannot be negative")
                    .addPropertyNode("lowLevelThreshold")
                    .addConstraintViolation();
            valid = false;
        }

        if (dto.getOverstockedThreshold() == null) {
            context.buildConstraintViolationWithTemplate("Overstock threshold is required")
                    .addPropertyNode("overstockedThreshold")
                    .addConstraintViolation();
            valid = false;
        } else if (dto.getOverstockedThreshold() < 1) {
            context.buildConstraintViolationWithTemplate("Threshold must be at least 1")
                    .addPropertyNode("overstockedThreshold")
                    .addConstraintViolation();
            valid = false;
        }

        if (valid
                && dto.getLowLevelThreshold() != null
                && dto.getOverstockedThreshold() != null
                && dto.getOverstockedThreshold() <= dto.getLowLevelThreshold()) {
            context.buildConstraintViolationWithTemplate(
                            "Overstock threshold must be greater than low stock threshold")
                    .addPropertyNode("overstockedThreshold")
                    .addConstraintViolation();
            valid = false;
        }

        return valid;
    }
}
