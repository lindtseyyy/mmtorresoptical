package com.mmtorresoptical.OpticalClinicManagementSystem.validation;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;

public interface ProductRequest {
    ProductType getProductType();
    String getSupplier();
    Integer getLowLevelThreshold();
    Integer getOverstockedThreshold();
}
