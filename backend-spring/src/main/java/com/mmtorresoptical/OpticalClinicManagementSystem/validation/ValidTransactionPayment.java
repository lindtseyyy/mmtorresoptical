package com.mmtorresoptical.OpticalClinicManagementSystem.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = TransactionPaymentValidator.class)
@Documented
public @interface ValidTransactionPayment {

    String message() default "Invalid payment details";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}