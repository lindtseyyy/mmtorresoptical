package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionItemsRepository;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PrescriptionItemsController {

    private final PrescriptionItemsRepository prescriptionItemsRepository;

    PrescriptionItemsController(PrescriptionItemsRepository prescriptionItemsRepository) {
        this.prescriptionItemsRepository = prescriptionItemsRepository;
    }
}
