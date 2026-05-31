package com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalMetricsDTO {
    private VisualAcuityDTO visualAcuity;
    private IntraocularPressureDTO intraocularPressure;
}
