package com.mmtorresoptical.OpticalClinicManagementSystem.validation;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;

public class TransactionPaymentValidator
        implements ConstraintValidator<ValidTransactionPayment, TransactionRequestDTO> {

    @Override
    public boolean isValid(TransactionRequestDTO dto,
                           ConstraintValidatorContext context) {

        if (dto.getPaymentType() == null) {
            return true; // let @NotNull handle it
        }

        if (dto.getPaymentType() == PaymentType.CASH) {
            if (dto.getCashTender() == null || dto.getCashTender().compareTo(BigDecimal.ZERO) <= 0) {

                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                                "Cash tender is required for CASH payment")
                        .addPropertyNode("cashTender")
                        .addConstraintViolation();

                return false;
            }
        }

        if (dto.getPaymentType() == PaymentType.GCASH) {
            boolean noReference =
                    dto.getReferenceNumber() == null ||
                            dto.getReferenceNumber().isBlank();

            boolean noImage =
                    dto.getGcashPaymentImg() == null ||
                            dto.getGcashPaymentImg().isBlank();

            if (noReference && noImage) {

                context.buildConstraintViolationWithTemplate(
                                "Either reference number or proof image is required for GCASH payment")
                        .addPropertyNode("referenceNumber")
                        .addConstraintViolation();

                context.buildConstraintViolationWithTemplate(
                                "Either reference number or proof image is required for GCASH payment")
                        .addPropertyNode("gcashPaymentImg")
                        .addConstraintViolation();

                return false;
            }
        }

        return true;
    }
}
