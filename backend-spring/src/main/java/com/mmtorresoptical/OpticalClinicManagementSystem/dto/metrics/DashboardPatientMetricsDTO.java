package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

public class DashboardPatientMetricsDTO {
    private final long totalActivePatients;
    private final long newPatientsThisMonth;
    private final long pendingFollowUps;
    private final long patientsSeenThisMonth;

    public DashboardPatientMetricsDTO(long totalActivePatients, long newPatientsThisMonth, long pendingFollowUps, long patientsSeenThisMonth) {
        this.totalActivePatients = totalActivePatients;
        this.newPatientsThisMonth = newPatientsThisMonth;
        this.pendingFollowUps = pendingFollowUps;
        this.patientsSeenThisMonth = patientsSeenThisMonth;
    }

    public long getTotalActivePatients() { return totalActivePatients; }
    public long getNewPatientsThisMonth() { return newPatientsThisMonth; }
    public long getPendingFollowUps() { return pendingFollowUps; }
    public long getPatientsSeenThisMonth() { return patientsSeenThisMonth; }
}
