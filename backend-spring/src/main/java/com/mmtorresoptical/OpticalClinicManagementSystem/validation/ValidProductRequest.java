package com.mmtorresoptical.OpticalClinicManagementSystem.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ProductRequestValidator.class)
@Documented
public @interface ValidProductRequest {

    String message() default "Invalid product request";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
