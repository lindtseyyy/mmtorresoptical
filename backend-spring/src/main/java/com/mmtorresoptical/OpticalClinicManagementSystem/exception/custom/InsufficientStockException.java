package com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom;

public class InsufficientStockException
        extends RuntimeException {

    public InsufficientStockException(String message) {
        super(message);
    }
}