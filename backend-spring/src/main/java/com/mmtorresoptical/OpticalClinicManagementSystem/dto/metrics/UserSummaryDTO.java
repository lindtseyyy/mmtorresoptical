package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

public class UserSummaryDTO {
    private long totalUsers;
    private long activeUsers;
    private long archivedUsers;
    private long adminUsers;
    private long staffUsers;

    public UserSummaryDTO(long totalUsers, long activeUsers, long archivedUsers, long adminUsers, long staffUsers) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.archivedUsers = archivedUsers;
        this.adminUsers = adminUsers;
        this.staffUsers = staffUsers;
    }

    public long getTotalUsers() { return totalUsers; }
    public long getActiveUsers() { return activeUsers; }
    public long getArchivedUsers() { return archivedUsers; }
    public long getAdminUsers() { return adminUsers; }
    public long getStaffUsers() { return staffUsers; }
}
