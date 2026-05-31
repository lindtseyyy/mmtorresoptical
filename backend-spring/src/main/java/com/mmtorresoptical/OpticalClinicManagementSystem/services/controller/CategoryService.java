package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.category.CategoryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.category.CategoryWithProductCountDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Category;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<CategoryWithProductCountDTO> getAllCategoriesWithProductCounts() {
        return categoryRepository.findAllWithProductCounts()
                .stream()
                .map(row -> {
                    Category cat = (Category) row[0];
                    Long count = (Long) row[1];
                    return CategoryWithProductCountDTO.builder()
                            .categoryId(cat.getCategoryId())
                            .name(cat.getName())
                            .isActive(cat.getIsActive())
                            .productCount(count)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Category findOrCreate(String name) {
        return categoryRepository.findByNameIgnoreCase(name.trim())
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(name.trim());
                    category.setIsActive(true);
                    return categoryRepository.saveAndFlush(category);
                });
    }

    @Transactional
    public CategoryDTO toggleActive(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + categoryId));
        category.setIsActive(!category.getIsActive());
        categoryRepository.save(category);
        return toDTO(category);
    }

    @Transactional
    public void deleteCategoryIfUnused(UUID categoryId) {
        List<Object[]> rows = categoryRepository.findAllWithProductCounts();
        for (Object[] row : rows) {
            Category cat = (Category) row[0];
            Long count = (Long) row[1];
            if (cat.getCategoryId().equals(categoryId)) {
                if (count > 0) {
                    throw new IllegalStateException(
                            "Cannot delete category '" + cat.getName() + "' — it is linked to " + count + " product(s). Archive it instead."
                    );
                }
                categoryRepository.delete(cat);
                return;
            }
        }
        throw new IllegalArgumentException("Category not found with id: " + categoryId);
    }

    private CategoryDTO toDTO(Category category) {
        return CategoryDTO.builder()
                .categoryId(category.getCategoryId())
                .name(category.getName())
                .build();
    }
}
