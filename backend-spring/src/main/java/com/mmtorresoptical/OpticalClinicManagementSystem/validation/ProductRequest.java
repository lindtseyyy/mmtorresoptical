package com.mmtorresoptical.OpticalClinicManagementSystem.validation;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;

import java.util.UUID;

public interface ProductRequest {
    ProductType getProductType();
    UUID getSupplierId();
    String getNewSupplierName();
    Integer getLowLevelThreshold();
    Integer getOverstockedThreshold();
}
