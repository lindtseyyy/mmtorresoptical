package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.CreateEyeExamRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.EyeExamDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam.EyeExamResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.EyeExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EyeExamController {

    private final EyeExamService eyeExamService;

    @PostMapping("/patients/{id}/eye-exams")
    public ResponseEntity<EyeExamResponseDTO> createEyeExam(
            @PathVariable UUID id,
            @RequestBody CreateEyeExamRequestDTO requestDTO) {
        EyeExamResponseDTO response = eyeExamService.createEyeExam(id, requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/patients/{id}/eye-exams")
    public ResponseEntity<Page<EyeExamDetailsDTO>> getAllEyeExams(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate minDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maxDate,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(defaultValue = "ACTIVE") String archivedStatus) {
        Page<EyeExamDetailsDTO> response = eyeExamService.getAllEyeExams(
                id, keyword, minDate, maxDate, page, size, sortBy, sortOrder, archivedStatus);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/eye-exams/{id}")
    public ResponseEntity<EyeExamDetailsDTO> getEyeExam(@PathVariable UUID id) {
        EyeExamDetailsDTO response = eyeExamService.getEyeExam(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/eye-exams/{id}")
    public ResponseEntity<Void> archiveEyeExam(@PathVariable UUID id) {
        eyeExamService.archiveEyeExam(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/eye-exams/{id}/restore")
    public ResponseEntity<Void> restoreEyeExam(@PathVariable UUID id) {
        eyeExamService.restoreEyeExam(id);
        return ResponseEntity.noContent().build();
    }
}
