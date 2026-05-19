package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.TransactionMonthlyTrendPoint;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.RefundStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.RefundItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.RefundReceipt;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.objects.TopSellingProductDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.TransactionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.analytics.InventoryAnalyticsService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportAggregationService {

    private final InventoryAnalyticsService inventoryAnalyticsService;
    private final TransactionService transactionService;
    private final PatientRepository patientRepository;
    private final TransactionRepository transactionRepository;

    public TabularReportDataset buildReport(ReportType reportType, LocalDate minDate, LocalDate maxDate) {
        ReportMetadata metadata = ReportMetadata.builder()
                .generatedAt(Instant.now())
                .generatedBy(resolveGeneratedBy())
                .reportType(reportType)
                .title(reportType != null ? reportType.getDisplayTitle() : "UNKNOWN")
                .build();

        if (reportType == null) {
            return TabularReportDataset.empty(metadata);
        }

        return switch (reportType) {
            case TRANSACTIONS -> buildTransactionsReport(metadata, minDate, maxDate);
            case PATIENTS -> buildPatientReportAsTabular(metadata, minDate, maxDate);
            default -> TabularReportDataset.empty(metadata);
        };
    }

    public ComprehensiveInventoryReportDataset buildInventoryAnalyticsReport() {
        int topN = 10;
        ReportMetadata metadata = ReportMetadata.builder()
                .generatedAt(Instant.now())
                .generatedBy(resolveGeneratedBy())
                .reportType(ReportType.INVENTORY_ANALYTICS)
                .title("Comprehensive Inventory Analytics Report")
                .build();

        var analytics = inventoryAnalyticsService.getInventoryAnalytics();
        return ComprehensiveInventoryReportDataset.builder()
                .metadata(metadata)
                .totalInventoryValue(analytics.getInventoryValue())
                .totalLowStockCount(analytics.getCountLowStockProducts())
                .totalOverstockCount(analytics.getCountOverstockedProducts())
                .lowStockProducts(inventoryAnalyticsService.getAllLowStockProducts())
                .overstockProducts(inventoryAnalyticsService.getAllOverStockedProducts())
                .topSellingProducts(inventoryAnalyticsService.getTopSellingProductsAllTimeTopN(topN))
                .build();
    }

    private TabularReportDataset buildTransactionsReport(
            ReportMetadata metadata,
            LocalDate minDate,
            LocalDate maxDate
    ) {
        List<Transaction> transactions = transactionService.getTransactionsForReport(minDate, maxDate);

        if (transactions.isEmpty()) {
            return TabularReportDataset.empty(metadata, "No transactions available.");
        }

        List<String> columns = Arrays.asList(
                "Transaction ID",
                "Transaction Date",
                "Total Amount",
                "Amount Paid",
                "Balance Due",
                "Status"
        );

        List<List<Object>> rows = transactions.stream()
                .map(transaction -> Arrays.<Object>asList(
                        transaction.getTransactionId(),
                        transaction.getTransactionDate(),
                        transaction.getTotalAmount(),
                        transaction.getAmountPaid(),
                        transaction.getBalanceDue(),
                        transaction.getTransactionStatus()
                ))
                .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PatientReportDataset.PatientGrowthPoint> computePatientGrowthTrend() {
        List<PatientReportDataset.PatientGrowthPoint> growthTrend = new ArrayList<>();

        YearMonth currentMonth = YearMonth.now();
        YearMonth trendStart = currentMonth.minusMonths(11);
        LocalDateTime trendStartDateTime = trendStart.atDay(1).atStartOfDay();

        List<Patient> patientsInTrendPeriod = patientRepository.findByCreatedAtAfter(trendStartDateTime);

        java.util.Map<YearMonth, Integer> monthlyCounts = new java.util.LinkedHashMap<>();
        for (YearMonth ym = trendStart; !ym.isAfter(currentMonth); ym = ym.plusMonths(1)) {
            monthlyCounts.put(ym, 0);
        }
        for (Patient p : patientsInTrendPeriod) {
            YearMonth ym = YearMonth.from(p.getCreatedAt());
            monthlyCounts.merge(ym, 1, Integer::sum);
        }
        monthlyCounts.forEach((ym, count) ->
            growthTrend.add(new PatientReportDataset.PatientGrowthPoint(
                ym.getYear() + "-" + String.format("%02d", ym.getMonthValue()), count))
        );

        return growthTrend;
    }

    @Transactional(readOnly = true)
    public List<TransactionMonthlyTrendPoint> computeTransactionMonthlyTrend() {
        List<TransactionMonthlyTrendPoint> trend = new ArrayList<>();

        YearMonth currentMonth = YearMonth.now();
        YearMonth trendStart = currentMonth.minusMonths(11);
        LocalDate trendStartDate = trendStart.atDay(1);
        LocalDate trendEndDate = currentMonth.atEndOfMonth();

        List<Transaction> transactions = transactionService.getTransactionsForReport(trendStartDate, trendEndDate);

        Map<YearMonth, long[]> monthlyCounts = new LinkedHashMap<>();
        Map<YearMonth, BigDecimal> netRevenueMap = new LinkedHashMap<>();
        for (YearMonth ym = trendStart; !ym.isAfter(currentMonth); ym = ym.plusMonths(1)) {
            monthlyCounts.put(ym, new long[1]);
            netRevenueMap.put(ym, BigDecimal.ZERO);
        }

        for (Transaction t : transactions) {
            YearMonth ym = YearMonth.from(t.getTransactionDate());
            long[] bucket = monthlyCounts.get(ym);
            if (bucket == null) continue;

            bucket[0]++;

            BigDecimal netContribution = computeNetRevenueContribution(t);
            netRevenueMap.merge(ym, netContribution, BigDecimal::add);
        }

        for (YearMonth ym = trendStart; !ym.isAfter(currentMonth); ym = ym.plusMonths(1)) {
            String monthKey = ym.getYear() + "-" + String.format("%02d", ym.getMonthValue());
            trend.add(TransactionMonthlyTrendPoint.builder()
                    .month(monthKey)
                    .transactionCount(monthlyCounts.get(ym)[0])
                    .netRevenue(netRevenueMap.get(ym))
                    .build());
        }

        return trend;
    }

    private BigDecimal computeNetRevenueContribution(Transaction t) {
        TransactionStatus paymentStatus = t.getTransactionStatus();
        if (paymentStatus == null) return BigDecimal.ZERO;

        BigDecimal totalAmount = t.getTotalAmount() != null ? t.getTotalAmount() : BigDecimal.ZERO;

        BigDecimal base = switch (paymentStatus) {
            case COMPLETED, PAID -> totalAmount;
            case DEPOSIT -> t.getAmountPaid() != null ? t.getAmountPaid() : BigDecimal.ZERO;
            case VOIDED -> totalAmount.negate();
            default -> BigDecimal.ZERO;
        };

        // Subtract refunds if any were issued
        RefundStatus refundStatus = t.getRefundStatus();
        if (refundStatus == RefundStatus.PARTIAL || refundStatus == RefundStatus.FULL) {
            BigDecimal refundSum = BigDecimal.ZERO;
            if (t.getRefundReceipts() != null) {
                for (RefundReceipt receipt : t.getRefundReceipts()) {
                    if (receipt.getRefundItems() != null) {
                        for (RefundItem refundItem : receipt.getRefundItems()) {
                            if (refundItem.getItemCreditAmount() != null) {
                                refundSum = refundSum.add(refundItem.getItemCreditAmount());
                            }
                        }
                    }
                }
            }
            base = base.subtract(refundSum);
        }

        return base;
    }

    @Transactional(readOnly = true)
    public PatientReportDataset buildPatientReport(ReportType reportType, LocalDate minDate, LocalDate maxDate) {
        return buildPatientReportInternal(minDate, maxDate,
                reportType != null ? reportType.getDisplayTitle() : "Patient Report",
                reportType);
    }

    private PatientReportDataset buildPatientReportInternal(
            LocalDate minDate, LocalDate maxDate, String title, ReportType reportType) {

        boolean isOverall = (minDate == null && maxDate == null);

        ReportMetadata metadata = ReportMetadata.builder()
                .generatedAt(Instant.now())
                .generatedBy(resolveGeneratedBy())
                .reportType(reportType)
                .title(title)
                .build();

        long activePatients = patientRepository.countByIsArchived(false);
        long archivedPatients = patientRepository.countByIsArchived(true);

        int maleCount = (int) patientRepository.countByGender(Gender.MALE);
        int femaleCount = (int) patientRepository.countByGender(Gender.FEMALE);
        int otherGenderCount = (int) patientRepository.countByGender(Gender.OTHERS);

        List<Patient> activePatientList = patientRepository.findAllActive();
        List<PatientReportDataset.AgeGroupStat> ageGroups = computeAgeGroupDistribution(activePatientList);

        int totalVisits, completedVisits, missedOrCancelledVisits;
        int newPatientsInPeriod = 0;
        List<PatientReportDataset.PatientGrowthPoint> growthTrend = computePatientGrowthTrend();

        if (isOverall) {
            totalVisits = (int) transactionRepository.count();
            completedVisits = (int) transactionRepository.countByTransactionStatus(TransactionStatus.COMPLETED);
            missedOrCancelledVisits = (int) transactionRepository.countByTransactionStatus(TransactionStatus.VOIDED);
        } else {
            LocalDateTime rangeStart = minDate != null ? minDate.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime rangeEnd = maxDate != null ? maxDate.atTime(LocalTime.MAX) : now;

            newPatientsInPeriod = (int) patientRepository.countByCreatedAtBetween(rangeStart, rangeEnd);

            totalVisits = (int) transactionRepository.countByTransactionDateBetween(rangeStart, rangeEnd);
            completedVisits = (int) transactionRepository.countByTransactionStatusAndTransactionDateBetween(
                    TransactionStatus.COMPLETED, rangeStart, rangeEnd);
            missedOrCancelledVisits = (int) transactionRepository.countByTransactionStatusAndTransactionDateBetween(
                    TransactionStatus.VOIDED, rangeStart, rangeEnd);
        }

        return PatientReportDataset.builder()
                .metadata(metadata)
                .minDate(minDate)
                .maxDate(maxDate)
                .overallReport(isOverall)
                .totalPatients((int) (activePatients + archivedPatients))
                .activePatients((int) activePatients)
                .archivedPatients((int) archivedPatients)
                .newPatientsInPeriod(newPatientsInPeriod)
                .maleCount(maleCount)
                .femaleCount(femaleCount)
                .otherGenderCount(otherGenderCount)
                .ageGroupDistribution(ageGroups)
                .totalVisits(totalVisits)
                .completedVisits(completedVisits)
                .missedOrCancelledVisits(missedOrCancelledVisits)
                .patientGrowthTrend(growthTrend)
                .build();
    }

    private TabularReportDataset buildPatientReportAsTabular(
            ReportMetadata metadata, LocalDate minDate, LocalDate maxDate) {
        PatientReportDataset dataset = buildPatientReportInternal(minDate, maxDate,
                metadata.getTitle(), metadata.getReportType());

        List<String> columns = Arrays.asList("Metric", "Value");

        List<List<Object>> rows = new ArrayList<>();
        rows.add(Arrays.<Object>asList("Total Patients", dataset.getTotalPatients()));
        rows.add(Arrays.<Object>asList("Active Patients", dataset.getActivePatients()));
        rows.add(Arrays.<Object>asList("Archived Patients", dataset.getArchivedPatients()));
        rows.add(Arrays.<Object>asList("Male", dataset.getMaleCount()));
        rows.add(Arrays.<Object>asList("Female", dataset.getFemaleCount()));
        if (dataset.getOtherGenderCount() > 0) {
            rows.add(Arrays.<Object>asList("Other Gender", dataset.getOtherGenderCount()));
        }
        rows.add(Arrays.<Object>asList("Total Visits", dataset.getTotalVisits()));
        rows.add(Arrays.<Object>asList("Completed Visits", dataset.getCompletedVisits()));
        rows.add(Arrays.<Object>asList("Missed/Cancelled Visits", dataset.getMissedOrCancelledVisits()));

        if (!dataset.isOverallReport()) {
            rows.add(Arrays.<Object>asList("New Patients in Period", dataset.getNewPatientsInPeriod()));
        }

        if (dataset.getAgeGroupDistribution() != null) {
            for (PatientReportDataset.AgeGroupStat stat : dataset.getAgeGroupDistribution()) {
                rows.add(Arrays.<Object>asList("Age: " + stat.groupLabel(), stat.count()));
            }
        }

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private List<PatientReportDataset.AgeGroupStat> computeAgeGroupDistribution(List<Patient> patients) {
        int[] buckets = new int[7];
        String[] labels = {"0-17", "18-25", "26-35", "36-45", "46-55", "56-65", "66+"};

        LocalDate now = LocalDate.now();
        for (Patient p : patients) {
            if (p.getBirthDate() == null) continue;
            int age = Period.between(p.getBirthDate(), now).getYears();
            if (age < 0) continue;
            if (age <= 17) buckets[0]++;
            else if (age <= 25) buckets[1]++;
            else if (age <= 35) buckets[2]++;
            else if (age <= 45) buckets[3]++;
            else if (age <= 55) buckets[4]++;
            else if (age <= 65) buckets[5]++;
            else buckets[6]++;
        }

        List<PatientReportDataset.AgeGroupStat> result = new ArrayList<>();
        for (int i = 0; i < buckets.length; i++) {
            result.add(new PatientReportDataset.AgeGroupStat(labels[i], buckets[i]));
        }
        return result;
    }

    private String resolveGeneratedBy() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "System";
        }

        String username = auth.getName();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority())
                .orElse("UNKNOWN");

        if (role.startsWith("ROLE_")) {
            role = role.substring("ROLE_".length());
        }

        if (username == null || username.isBlank()) {
            username = "System";
        }

        return username + " (" + role + ")";
    }
}
