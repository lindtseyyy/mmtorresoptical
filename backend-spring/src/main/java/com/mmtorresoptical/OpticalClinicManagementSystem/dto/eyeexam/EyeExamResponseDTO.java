package com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class EyeExamResponseDTO {

    private UUID eyeExamId;
    private String examNumber;
    private LocalDateTime createdAt;
    private String examType;
    private String chiefComplaint;
    private String medicalHistorySnapshot;
    private String vaUnconvertedOd;
    private String vaUnconvertedOs;
    private String vaAidedOd;
    private String vaAidedOs;
    private String iopOd;
    private String iopOs;
    private String slitLampExamination;
    private String fundusExamination;
    private String clinicalImpression;
    private String planNotes;
    private Boolean isArchived;
    private String status;
    private UserSummaryDTO performedBy;
}
