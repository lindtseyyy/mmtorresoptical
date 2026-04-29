package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientReportDataset {

    private ReportMetadata metadata;

    private LocalDate minDate;
    private LocalDate maxDate;
    private boolean overallReport;

    private int totalPatients;
    private int activePatients;
    private int archivedPatients;
    private int newPatientsInPeriod;

    private int maleCount;
    private int femaleCount;
    private int otherGenderCount;

    private List<AgeGroupStat> ageGroupDistribution;

    private int totalVisits;
    private int completedVisits;
    private int missedOrCancelledVisits;

    private boolean growthComparisonAvailable;
    private String currentPeriodLabel;
    private String previousPeriodLabel;
    private int currentPeriodCount;
    private int previousPeriodCount;
    private double growthPercentage;

    public record AgeGroupStat(String groupLabel, int count) {}
}
