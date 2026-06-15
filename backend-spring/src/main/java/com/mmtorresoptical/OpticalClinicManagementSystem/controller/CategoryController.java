package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.category.CategoryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.category.CategoryWithProductCountDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.CategoryType;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(
            @RequestParam String name,
            @RequestParam CategoryType type,
            @RequestParam(required = false, defaultValue = "false") Boolean isPerishable) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(name, type, isPerishable));
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories(
            @RequestParam(required = false) CategoryType type) {
        return ResponseEntity.ok(categoryService.getAllCategories(type));
    }

    @GetMapping("/all")
    public ResponseEntity<List<CategoryWithProductCountDTO>> getAllCategoriesWithProductCounts(
            @RequestParam(required = false) CategoryType type) {
        return ResponseEntity.ok(categoryService.getAllCategoriesWithProductCounts(type));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable UUID id,
            @RequestParam String name) {
        return ResponseEntity.ok(categoryService.updateCategory(id, name));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<CategoryDTO> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.toggleActive(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-perishable")
    public ResponseEntity<CategoryDTO> togglePerishable(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.togglePerishable(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategoryIfUnused(id);
        return ResponseEntity.noContent().build();
    }
}
