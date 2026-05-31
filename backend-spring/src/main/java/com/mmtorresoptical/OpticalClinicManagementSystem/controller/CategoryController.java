package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.category.CategoryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.category.CategoryWithProductCountDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/all")
    public ResponseEntity<List<CategoryWithProductCountDTO>> getAllCategoriesWithProductCounts() {
        return ResponseEntity.ok(categoryService.getAllCategoriesWithProductCounts());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<CategoryDTO> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.toggleActive(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategoryIfUnused(id);
        return ResponseEntity.noContent().build();
    }
}
