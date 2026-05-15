package com.mmtorresoptical.OpticalClinicManagementSystem.validation;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionRequestDTO;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;

public class TransactionPaymentValidator
        implements ConstraintValidator<ValidTransactionPayment, TransactionRequestDTO> {

    @Override
    public boolean isValid(TransactionRequestDTO dto,
                           ConstraintValidatorContext context) {

        BigDecimal tendered = dto.getAmountTendered();
        if (tendered != null && tendered.compareTo(BigDecimal.ZERO) < 0) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                            "Amount tendered cannot be negative")
                    .addPropertyNode("amountTendered")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}
