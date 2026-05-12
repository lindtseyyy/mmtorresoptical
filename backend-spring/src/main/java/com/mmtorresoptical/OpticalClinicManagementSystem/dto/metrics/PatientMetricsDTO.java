package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

public class PatientMetricsDTO {
    private long totalPatients;
    private long newThisMonth;
    private long pendingFollowUps;
    private long archivedPatients;

    public PatientMetricsDTO(long totalPatients, long newThisMonth, long pendingFollowUps, long archivedPatients) {
        this.totalPatients = totalPatients;
        this.newThisMonth = newThisMonth;
        this.pendingFollowUps = pendingFollowUps;
        this.archivedPatients = archivedPatients;
    }

    public long getTotalPatients() { return totalPatients; }
    public long getNewThisMonth() { return newThisMonth; }
    public long getPendingFollowUps() { return pendingFollowUps; }
    public long getArchivedPatients() { return archivedPatients; }
}
