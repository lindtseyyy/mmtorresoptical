package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

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
            case INVENTORY_LOW_STOCK -> buildInventoryLowStockReport(metadata);
            case INVENTORY_OVERSTOCK -> buildInventoryOverstockReport(metadata);
            case INVENTORY_TOP_SELLING -> buildInventoryTopSellingReport(metadata);
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

    private TabularReportDataset buildInventoryLowStockReport(ReportMetadata metadata) {
        List<ProductDetailsDTO> products = inventoryAnalyticsService.getAllLowStockProducts();
        List<String> columns = List.of(
                "Product Name",
                "Category",
                "Supplier",
                "Unit Price",
                "Quantity",
                "Low Stock Threshold"
        );

        List<List<Object>> rows = products.stream()
            .map(product -> Arrays.<Object>asList(
                product.getProductName(),
                product.getCategory(),
                product.getSupplier(),
                product.getUnitPrice(),
                product.getQuantity(),
                product.getLowLevelThreshold()
            ))
            .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private TabularReportDataset buildInventoryOverstockReport(ReportMetadata metadata) {
        List<ProductDetailsDTO> products = inventoryAnalyticsService.getAllOverStockedProducts();
        List<String> columns = Arrays.asList(
                "Product Name",
                "Category",
                "Supplier",
                "Unit Price",
                "Quantity",
                "Overstock Threshold"
        );

        List<List<Object>> rows = products.stream()
            .map(product -> Arrays.<Object>asList(
                product.getProductName(),
                product.getCategory(),
                product.getSupplier(),
                product.getUnitPrice(),
                product.getQuantity(),
                product.getOverstockedThreshold()
            ))
            .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private TabularReportDataset buildInventoryTopSellingReport(ReportMetadata metadata) {
        List<TopSellingProductDTO> products = inventoryAnalyticsService.getAllTopSellingProducts(null, null);
        List<String> columns = Arrays.asList(
                "Product Name",
                "Category",
                "Total Quantity Sold",
                "Total Revenue"
        );

        List<List<Object>> rows = products.stream()
            .map(product -> Arrays.<Object>asList(
                product.productName(),
                product.category(),
                product.totalSold(),
                product.totalRevenue()
            ))
            .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
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
                "Payment Type",
                "Status",
                "Reference No"
        );

        List<List<Object>> rows = transactions.stream()
                .map(transaction -> Arrays.<Object>asList(
                        transaction.getTransactionId(),
                        transaction.getTransactionDate(),
                        transaction.getTotalAmount(),
                        transaction.getPaymentType(),
                        transaction.getTransactionStatus(),
                        transaction.getReferenceNumber()
                ))
                .toList();

        return TabularReportDataset.builder()
                .metadata(metadata)
                .columns(columns)
                .rows(rows)
                .build();
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
        boolean growthAvailable = false;
        String currLabel = "", prevLabel = "";
        int currCount = 0, prevCount = 0;
        double growthPct = 0;

        if (isOverall) {
            totalVisits = (int) transactionRepository.count();
            completedVisits = (int) transactionRepository.countByTransactionStatus(TransactionStatus.COMPLETED);
            missedOrCancelledVisits = (int) transactionRepository.countByTransactionStatus(TransactionStatus.VOIDED);

            YearMonth thisMonth = YearMonth.now();
            YearMonth lastMonth = thisMonth.minusMonths(1);

            LocalDateTime thisMonthStart = thisMonth.atDay(1).atStartOfDay();
            LocalDateTime thisMonthEnd = thisMonth.atEndOfMonth().atTime(LocalTime.MAX);
            LocalDateTime lastMonthStart = lastMonth.atDay(1).atStartOfDay();
            LocalDateTime lastMonthEnd = lastMonth.atEndOfMonth().atTime(LocalTime.MAX);

            currCount = (int) patientRepository.countByCreatedAtBetween(thisMonthStart, thisMonthEnd);
            prevCount = (int) patientRepository.countByCreatedAtBetween(lastMonthStart, lastMonthEnd);

            DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMMM yyyy");
            currLabel = thisMonth.format(monthFmt);
            prevLabel = lastMonth.format(monthFmt);

            if (prevCount > 0) {
                growthPct = ((double)(currCount - prevCount) / prevCount) * 100.0;
                growthAvailable = true;
            } else if (currCount > 0) {
                growthPct = 100.0;
                growthAvailable = true;
            }
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
                .growthComparisonAvailable(growthAvailable)
                .currentPeriodLabel(currLabel)
                .previousPeriodLabel(prevLabel)
                .currentPeriodCount(currCount)
                .previousPeriodCount(prevCount)
                .growthPercentage(growthPct)
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

        if (dataset.isOverallReport() && dataset.isGrowthComparisonAvailable()) {
            rows.add(Arrays.<Object>asList(
                    "Growth (" + dataset.getCurrentPeriodLabel() + " vs " + dataset.getPreviousPeriodLabel() + ")",
                    String.format("%+.2f%%", dataset.getGrowthPercentage())));
        }

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
