package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

public class PatientMaintenanceMetricsDTO {
    private final long archivedPatients;
    private final long patientsWithoutPurchases;
    private final long stalePendingFollowUps;

    public PatientMaintenanceMetricsDTO(long archivedPatients, long patientsWithoutPurchases, long stalePendingFollowUps) {
        this.archivedPatients = archivedPatients;
        this.patientsWithoutPurchases = patientsWithoutPurchases;
        this.stalePendingFollowUps = stalePendingFollowUps;
    }

    public long getArchivedPatients() { return archivedPatients; }
    public long getPatientsWithoutPurchases() { return patientsWithoutPurchases; }
    public long getStalePendingFollowUps() { return stalePendingFollowUps; }
}
