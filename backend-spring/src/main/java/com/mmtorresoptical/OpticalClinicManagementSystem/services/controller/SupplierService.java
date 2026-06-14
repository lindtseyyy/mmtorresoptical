package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.supplier.SupplierDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.supplier.SupplierWithProductCountDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Supplier;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<SupplierDTO> getAllActive() {
        return supplierRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<SupplierWithProductCountDTO> getAllWithProductCounts() {
        return supplierRepository.findAllWithProductCounts()
                .stream()
                .map(row -> {
                    Supplier sup = (Supplier) row[0];
                    Long count = (Long) row[1];
                    return SupplierWithProductCountDTO.builder()
                            .supplierId(sup.getSupplierId())
                            .name(sup.getName())
                            .isActive(sup.getIsActive())
                            .productCount(count)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Supplier findOrCreate(String name) {
        return supplierRepository.findByNameIgnoreCase(name.trim())
                .orElseGet(() -> {
                    Supplier supplier = new Supplier();
                    supplier.setName(name.trim());
                    supplier.setIsActive(true);
                    return supplierRepository.saveAndFlush(supplier);
                });
    }

    @Transactional
    public SupplierDTO createSupplier(String name) {
        Supplier supplier = findOrCreate(name);
        return toDTO(supplier);
    }

    @Transactional
    public SupplierDTO updateSupplier(UUID supplierId, String name) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new BadRequestException("Supplier not found with id: " + supplierId));
        supplier.setName(name.trim());
        supplierRepository.save(supplier);
        return toDTO(supplier);
    }

    @Transactional
    public SupplierDTO toggleActive(UUID supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new BadRequestException("Supplier not found with id: " + supplierId));
        supplier.setIsActive(!supplier.getIsActive());
        supplierRepository.save(supplier);
        return toDTO(supplier);
    }

    @Transactional
    public void deleteIfUnused(UUID supplierId) {
        List<Object[]> rows = supplierRepository.findAllWithProductCounts();
        for (Object[] row : rows) {
            Supplier sup = (Supplier) row[0];
            Long count = (Long) row[1];
            if (sup.getSupplierId().equals(supplierId)) {
                if (count > 0) {
                    throw new BadRequestException(
                            "Cannot delete supplier '" + sup.getName() + "' — it is linked to " + count + " product(s). Archive it instead."
                    );
                }
                supplierRepository.delete(sup);
                return;
            }
        }
        throw new BadRequestException("Supplier not found with id: " + supplierId);
    }

    private SupplierDTO toDTO(Supplier supplier) {
        return SupplierDTO.builder()
                .supplierId(supplier.getSupplierId())
                .name(supplier.getName())
                .build();
    }
}
