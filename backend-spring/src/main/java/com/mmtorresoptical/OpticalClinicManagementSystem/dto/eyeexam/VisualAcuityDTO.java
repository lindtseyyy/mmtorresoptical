package com.mmtorresoptical.OpticalClinicManagementSystem.dto.eyeexam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisualAcuityDTO {
    private MeasurementDTO uncorrected;
    private MeasurementDTO aided;
}
