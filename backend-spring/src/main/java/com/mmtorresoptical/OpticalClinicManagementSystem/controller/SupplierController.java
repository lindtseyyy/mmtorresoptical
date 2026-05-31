package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.supplier.SupplierDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.supplier.SupplierWithProductCountDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<SupplierDTO>> getAllActiveSuppliers() {
        return ResponseEntity.ok(supplierService.getAllActive());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SupplierWithProductCountDTO>> getAllSuppliersWithProductCounts() {
        return ResponseEntity.ok(supplierService.getAllWithProductCounts());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<SupplierDTO> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(supplierService.toggleActive(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable UUID id) {
        supplierService.deleteIfUnused(id);
        return ResponseEntity.noContent().build();
    }
}
