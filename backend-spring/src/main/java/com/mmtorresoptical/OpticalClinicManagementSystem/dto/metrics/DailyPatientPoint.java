package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

public class DailyPatientPoint {
    private final int day;
    private final long count;

    public DailyPatientPoint(int day, long count) {
        this.day = day;
        this.count = count;
    }

    public int getDay() { return day; }
    public long getCount() { return count; }
}
