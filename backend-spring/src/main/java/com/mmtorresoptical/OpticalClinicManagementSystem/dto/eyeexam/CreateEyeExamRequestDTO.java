package com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ExamType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateEyeExamRequestDTO {

    @NotNull
    private ExamType examType;

    private String chiefComplaint;
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
}
