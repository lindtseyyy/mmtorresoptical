package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.TransactionMetricsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment.PaymentRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment.PaymentResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundTransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundItemDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.DiscountType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentMethod;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.InsufficientStockException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.TransactionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.TransactionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.TransactionAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.TransactionSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.AgingReceivableDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionItemRepository transactionItemRepository;
    private final TransactionMapper transactionMapper;
    private final AuthenticatedUserService authenticatedUserService;
    private final PatientRepository patientRepository;
    private final ProductRepository productRepository;
    private final TransactionItemMapper transactionItemMapper;
    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final TransactionAuditHelper transactionAuditHelper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public TransactionResponseDTO createTransaction(TransactionRequestDTO transactionRequestDTO) {
        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Patient patient = null;

        if (transactionRequestDTO.getPatientId() != null) {
            UUID patientId = transactionRequestDTO.getPatientId();
            patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        }

        Transaction transaction = transactionMapper.requestDTOtoEntity(transactionRequestDTO);

        transaction.setUser(authenticatedUser);
        transaction.setPatient(patient);

        List<TransactionItem> transactionItems = transactionRequestDTO.getItems()
                .stream().map(dto -> {

                    Product retrievedProduct = productRepository.findById(dto.getProductId())
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + dto.getProductId()));

                    if (Boolean.TRUE.equals(retrievedProduct.getIsArchived())) {
                        throw new BadRequestException(
                                "Cannot sell archived product: " + retrievedProduct.getProductName()
                        );
                    }

                    // Inventory guard: only decrement stock for PHYSICAL products
                    if (retrievedProduct.getProductType() == ProductType.PHYSICAL) {
                        if (retrievedProduct.getQuantity() < dto.getQuantity()) {
                            throw new InsufficientStockException(
                                    "Not enough stock for product: "
                                            + retrievedProduct.getProductName()
                            );
                        }
                        retrievedProduct.setQuantity(
                                retrievedProduct.getQuantity() - dto.getQuantity()
                        );
                    }

                    TransactionItem transactionItem = transactionItemMapper.requestDTOtoEntity(dto);

                    transactionItem.setProduct(retrievedProduct);
                    transactionItem.setTransaction(transaction);

                    transactionItem.setUnitPrice(retrievedProduct.getUnitPrice());

                    // Calculate subtotal
                    BigDecimal baseAmount =
                            retrievedProduct.getUnitPrice().multiply(BigDecimal.valueOf(dto.getQuantity()));

                    BigDecimal discountAmount = BigDecimal.ZERO;

                    if (dto.getDiscountType() != null && dto.getDiscountValue() != null) {

                        discountAmount = switch (dto.getDiscountType()) {
                            case PERCENT -> baseAmount.multiply(dto.getDiscountValue())
                                    .divide(BigDecimal.valueOf(100), 2,
                                            RoundingMode.HALF_UP);
                            case FIXED -> dto.getDiscountValue();
                        };
                    }

                    transactionItem.setSubtotal(baseAmount.subtract(discountAmount));

                    return transactionItem;
                }).toList();

        BigDecimal total = transactionItems
                .stream()
                .map(TransactionItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        transaction.setTotalAmount(total);
        transaction.setTransactionItems(transactionItems);
        transaction.setTransactionNumber(generateTransactionNumber());

        // Determine initial payment
        BigDecimal amountTendered = transactionRequestDTO.getAmountTendered();
        if (amountTendered == null) {
            amountTendered = BigDecimal.ZERO;
        }
        if (amountTendered.compareTo(total) > 0) {
            amountTendered = total;
        }

        transaction.setAmountPaid(amountTendered);
        transaction.setTransactionStatus(computeStatus(total, amountTendered));

        Transaction savedTransaction = transactionRepository.saveAndFlush(transaction);

        // Create initial payment record if money was tendered
        if (amountTendered.compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = new Payment();
            payment.setTransaction(savedTransaction);
            payment.setAmount(amountTendered);
            payment.setPaymentMethod(
                transactionRequestDTO.getPaymentMethod() != null
                    ? transactionRequestDTO.getPaymentMethod()
                    : PaymentMethod.CASH
            );
            payment.setReferenceNumber(transactionRequestDTO.getReferenceNumber());
            paymentRepository.save(payment);
        }

        // Audit Logging
        transactionAuditHelper.logCreate(savedTransaction);

        return enrichWithPayments(transactionMapper.entityToResponseDTO(savedTransaction));
    }

    @Transactional
    public PaymentResponseDTO addPayment(UUID transactionId, PaymentRequestDTO request) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + transactionId));

        if (transaction.getTransactionStatus() == TransactionStatus.COMPLETED) {
            throw new IllegalStateException("Cannot add payment to a completed transaction");
        }

        if (transaction.getTransactionStatus() == TransactionStatus.VOIDED) {
            throw new IllegalStateException("Cannot add payment to a voided transaction");
        }

        if (transaction.getTransactionStatus() == TransactionStatus.FULLY_REFUNDED) {
            throw new IllegalStateException("Cannot add payment to a fully refunded transaction");
        }

        BigDecimal remaining = transaction.getTotalAmount().subtract(transaction.getAmountPaid());
        if (request.getAmount().compareTo(remaining) > 0) {
            throw new BadRequestException("Payment amount exceeds remaining balance of " + remaining);
        }

        Payment payment = new Payment();
        payment.setTransaction(transaction);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setReferenceNumber(request.getReferenceNumber());
        paymentRepository.save(payment);

        BigDecimal newAmountPaid = transaction.getAmountPaid().add(request.getAmount());
        transaction.setAmountPaid(newAmountPaid);
        transaction.setTransactionStatus(computeStatus(transaction.getTotalAmount(), newAmountPaid));
        transactionRepository.save(transaction);

        PaymentResponseDTO response = new PaymentResponseDTO();
        response.setId(payment.getId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod().name());
        response.setReferenceNumber(payment.getReferenceNumber());
        response.setCreatedAt(payment.getCreatedAt());
        return response;
    }

    @Transactional
    public TransactionResponseDTO completeTransaction(UUID transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + transactionId));

        if (transaction.getTransactionStatus() != TransactionStatus.PAID) {
            throw new IllegalStateException("Only fully paid transactions can be completed. Current status: " + transaction.getTransactionStatus());
        }

        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setCompletedAt(LocalDateTime.now());
        Transaction saved = transactionRepository.save(transaction);
        return enrichWithPayments(transactionMapper.entityToResponseDTO(saved));
    }

    public List<PaymentResponseDTO> getPaymentsForTransaction(UUID transactionId) {
        return paymentRepository.findByTransactionTransactionIdOrderByCreatedAtDesc(transactionId)
                .stream().map(p -> {
                    PaymentResponseDTO dto = new PaymentResponseDTO();
                    dto.setId(p.getId());
                    dto.setAmount(p.getAmount());
                    dto.setPaymentMethod(p.getPaymentMethod().name());
                    dto.setReferenceNumber(p.getReferenceNumber());
                    dto.setCreatedAt(p.getCreatedAt());
                    return dto;
                }).collect(Collectors.toList());
    }

    public Page<TransactionListDTO> getAllTransactions(
            String keyword,
            LocalDate minDate,
            LocalDate maxDate,
            TransactionStatus status,
            UUID productId,
            int page,
            int size,
            String sortBy,
            String sortOrder
    ) {

        if (keyword != null && UUIDUtils.isUUID(keyword)) {
            Optional<Transaction> transaction =
                    transactionRepository.findById(UUID.fromString(keyword));

            if (transaction.isEmpty()) {
                return Page.empty();
            }

            return new PageImpl<>(
                    List.of(transactionMapper.entityToListDTO(transaction.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            direction = Sort.Direction.DESC;
        }

        Specification<Transaction> spec = Specification.allOf();

        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(TransactionSpecification.hasKeyword(keyword));
        }

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    TransactionSpecification.dateBetween(minDate, maxDate)
            );
        }

        if (status != null) {
            spec = spec.and(TransactionSpecification.hasTransactionStatus(status));
        }

        if (productId != null) {
            spec = spec.and(TransactionSpecification.hasProductId(productId));
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Transaction> transactions = transactionRepository.findAll(spec, pageable);

        return transactions.map(transactionMapper::entityToListDTO);
    }

    public TransactionDetailsDTO getTransaction(UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        TransactionDetailsDTO dto = transactionMapper.entityToDetailsDTO(transaction);

        // Attach payments
        List<PaymentResponseDTO> paymentDTOs = paymentRepository
                .findByTransactionTransactionIdOrderByCreatedAtDesc(id)
                .stream().map(p -> {
                    PaymentResponseDTO pd = new PaymentResponseDTO();
                    pd.setId(p.getId());
                    pd.setAmount(p.getAmount());
                    pd.setPaymentMethod(p.getPaymentMethod().name());
                    pd.setReferenceNumber(p.getReferenceNumber());
                    pd.setCreatedAt(p.getCreatedAt());
                    return pd;
                }).collect(Collectors.toList());
        dto.setPayments(paymentDTOs);

        return dto;
    }

    public List<Transaction> getTransactionsForReport(
            LocalDate minDate,
            LocalDate maxDate
    ) {
        Specification<Transaction> spec = Specification.allOf();

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    TransactionSpecification.dateBetween(minDate, maxDate)
            );
        }

        Sort sort = Sort.by(Sort.Direction.DESC, "transactionDate");
        return transactionRepository.findAll(spec, sort);
    }

    public TransactionMetricsDTO getTransactionMetrics() {

        long totalTransactions = transactionRepository.countByTransactionStatusNot(TransactionStatus.VOIDED);

        BigDecimal grossRevenue = transactionRepository.sumTotalAmountExcludingStatus(TransactionStatus.VOIDED);
        BigDecimal totalRefundedAmount = refundRepository.sumTotalRefundAmount();
        BigDecimal totalRevenue = grossRevenue.subtract(totalRefundedAmount);

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);

        long todayTransactions = transactionRepository.countByTransactionStatusNotAndTransactionDateBetween(TransactionStatus.VOIDED, startOfToday, startOfTomorrow);

        BigDecimal todayGrossRevenue = transactionRepository.sumTotalAmountByTransactionDateBetweenExcludingStatus(startOfToday, startOfTomorrow, TransactionStatus.VOIDED);
        BigDecimal todayTotalRefundedAmount = refundRepository.sumRefundAmountByRefundedAtBetween(startOfToday, startOfTomorrow);
        BigDecimal todayRevenue = todayGrossRevenue.subtract(todayTotalRefundedAmount);

        BigDecimal averageTransactionValue = totalTransactions > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfNextMonth = startOfMonth.plusMonths(1);

        long totalTransactionsThisMonth = transactionRepository.countByTransactionStatusNotAndTransactionDateBetween(TransactionStatus.VOIDED, startOfMonth, startOfNextMonth);

        BigDecimal totalRefundedAmountThisMonth = refundRepository.sumRefundAmountByRefundedAtBetween(startOfMonth, startOfNextMonth);

        BigDecimal todayTotalVoidedAmount = transactionRepository.sumVoidedAmountByTransactionDateBetween(startOfToday, startOfTomorrow);

        BigDecimal totalAccountsReceivable = transactionRepository.sumBalanceDueByTransactionStatusPartiallyPaid();

        long awaitingPickupCount = transactionRepository.countByTransactionStatus(TransactionStatus.PAID);

        return TransactionMetricsDTO.builder()
                .totalTransactions(totalTransactions)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .todayTransactions(todayTransactions)
                .averageTransactionValue(averageTransactionValue)
                .totalTransactionsThisMonth(totalTransactionsThisMonth)
                .totalRefundedAmount(totalRefundedAmount)
                .todayTotalRefundedAmount(todayTotalRefundedAmount)
                .totalRefundedAmountThisMonth(totalRefundedAmountThisMonth)
                .todayTotalVoidedAmount(todayTotalVoidedAmount)
                .totalAccountsReceivable(totalAccountsReceivable)
                .awaitingPickupCount(awaitingPickupCount)
                .build();
    }

    public List<AgingReceivableDTO> getAgingAccountsReceivable() {
        LocalDateTime cutoffDate = LocalDate.now().minusDays(14).atStartOfDay();
        List<Transaction> transactions = transactionRepository.findAgingAccountsReceivable(cutoffDate);

        LocalDate today = LocalDate.now();
        return transactions.stream().map(t -> {
            String customerName = t.getPatient() != null
                    ? t.getPatient().getFirstName() + " " + t.getPatient().getLastName()
                    : "Walk-in";

            long daysOutstanding = ChronoUnit.DAYS.between(t.getTransactionDate().toLocalDate(), today);

            return AgingReceivableDTO.builder()
                    .transactionId(t.getTransactionId().toString())
                    .transactionNumber(t.getTransactionNumber())
                    .transactionDate(t.getTransactionDate().toLocalDate())
                    .customerName(customerName)
                    .totalAmount(t.getTotalAmount())
                    .amountPaid(t.getAmountPaid())
                    .balanceDue(t.getBalanceDue())
                    .daysOutstanding(daysOutstanding)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void voidTransaction(UUID transactionId, VoidTransactionRequestDTO voidTransactionRequestDTO) {

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + transactionId));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        if (!passwordEncoder.matches(voidTransactionRequestDTO.getPassword(), authenticatedUser.getPasswordHash())) {
            throw new BadRequestException("Invalid password");
        }

        if (transaction.getTransactionStatus() == TransactionStatus.VOIDED) {
            throw new IllegalStateException("Transaction already voided");
        }

        if (transaction.getTransactionStatus() == TransactionStatus.FULLY_REFUNDED) {
            throw new IllegalStateException("Cannot void refunded transaction");
        }

        // Restore stock only for PHYSICAL products
        for (TransactionItem item : transaction.getTransactionItems()) {
            Product product = item.getProduct();
            if (product.getProductType() == ProductType.PHYSICAL) {
                product.setQuantity(
                        product.getQuantity() + item.getQuantity()
                );
                productRepository.save(product);
            }
        }

        transaction.setTransactionStatus(TransactionStatus.VOIDED);
        transaction.setVoidedBy(authenticatedUser);
        transaction.setVoidedAt(LocalDateTime.now());
        transaction.setVoidReason(voidTransactionRequestDTO.getReason());

        // Audit Logging
        transactionAuditHelper.logVoid(transaction);
    }

    @Transactional
    public void refundTransaction(
            RefundTransactionRequestDTO request
    ) {

        // Phase 1: validate, restore stock, calculate full-value refund amounts
        List<Refund> pendingRefunds = new ArrayList<>();
        List<TransactionItem> refundItems = new ArrayList<>();
        Transaction transaction = null;
        BigDecimal batchTotalFullAmount = BigDecimal.ZERO;

        for (RefundItemDTO dto : request.getItems()) {

            TransactionItem item =
                    transactionItemRepository.findById(
                            dto.getTransactionItemId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Transaction item not found: "
                                            + dto.getTransactionItemId()
                            )
                    );
            refundItems.add(item);
            transaction = item.getTransaction();

            // Block voided txn
            if (transaction.getTransactionStatus() == TransactionStatus.VOIDED) {
                throw new IllegalStateException(
                        "Cannot refund voided transaction"
                );
            }

            int alreadyRefunded =
                    item.getRefundedQuantity() == null
                            ? 0
                            : item.getRefundedQuantity();

            int newRefundQty = dto.getRefundQuantity();

            if (alreadyRefunded + newRefundQty > item.getQuantity()) {
                throw new IllegalArgumentException(
                        "Refund exceeds purchased quantity"
                );
            }

            // Restore stock only for PHYSICAL products
            Product product = item.getProduct();
            if (product.getProductType() == ProductType.PHYSICAL) {
                if ("Damaged".equalsIgnoreCase(dto.getRefundReason())) {
                    product.setDamagedQuantity(
                            product.getDamagedQuantity() + newRefundQty
                    );
                } else {
                    product.setQuantity(
                            product.getQuantity() + newRefundQty
                    );
                }
                productRepository.save(product);
            }

            BigDecimal unitPrice = item.getUnitPrice();
            BigDecimal refundAmount =
                    unitPrice.multiply(
                            BigDecimal.valueOf(dto.getRefundQuantity())
                    );

            if (item.getDiscountType() != null && item.getDiscountValue() != null) {

                if (item.getDiscountType() == DiscountType.FIXED) {

                    BigDecimal discountPerUnit =
                            item.getDiscountValue()
                                    .divide(
                                            BigDecimal.valueOf(item.getQuantity()),
                                            2,
                                            RoundingMode.HALF_UP
                                    );

                    BigDecimal refundDiscount =
                            discountPerUnit.multiply(
                                    BigDecimal.valueOf(dto.getRefundQuantity())
                            );

                    refundAmount = refundAmount.subtract(refundDiscount);

                } else if (item.getDiscountType() == DiscountType.PERCENT) {

                    BigDecimal percent =
                            item.getDiscountValue()
                                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

                    BigDecimal discountPerUnit =
                            item.getUnitPrice().multiply(percent);

                    BigDecimal refundDiscount =
                            discountPerUnit.multiply(
                                    BigDecimal.valueOf(dto.getRefundQuantity())
                            );

                    refundAmount = refundAmount.subtract(refundDiscount);
                }
            }

            batchTotalFullAmount = batchTotalFullAmount.add(refundAmount);

            Refund refund = new Refund();
            refund.setRefundAmount(refundAmount);
            refund.setTransactionItem(item);
            refund.setRefundQuantity(newRefundQty);
            refund.setRefundReason(dto.getRefundReason());
            refund.setRefundedAt(LocalDateTime.now());
            refund.setRefundMethod(request.getRefundMethod());
            refund.setUser(authenticatedUserService.getCurrentUser());

            pendingRefunds.add(refund);
        }

        // Phase 2: calculate payment cap and scaling factor
        BigDecimal totalAlreadyRefunded = BigDecimal.ZERO;
        if (transaction != null) {
            for (TransactionItem ti : transaction.getTransactionItems()) {
                if (ti.getRefunds() != null) {
                    for (Refund r : ti.getRefunds()) {
                        totalAlreadyRefunded = totalAlreadyRefunded.add(r.getRefundAmount());
                    }
                }
            }
        }

        BigDecimal maxRefundable = transaction.getAmountPaid().subtract(totalAlreadyRefunded);
        BigDecimal scale = BigDecimal.ONE;
        if (batchTotalFullAmount.compareTo(maxRefundable) > 0) {
            if (maxRefundable.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                        "Cannot refund: the paid amount has already been fully refunded."
                );
            }
            scale = maxRefundable.divide(batchTotalFullAmount, 4, RoundingMode.HALF_UP);
        }

        // Phase 3: save refunds with scaled amounts
        if (scale.compareTo(BigDecimal.ONE) < 0) {
            BigDecimal remaining = maxRefundable;
            for (int i = 0; i < pendingRefunds.size(); i++) {
                Refund refund = pendingRefunds.get(i);
                TransactionItem item = refund.getTransactionItem();

                BigDecimal scaledAmount;
                if (i == pendingRefunds.size() - 1) {
                    scaledAmount = remaining.max(BigDecimal.ZERO);
                } else {
                    scaledAmount = refund.getRefundAmount()
                            .multiply(scale).setScale(2, RoundingMode.HALF_UP);
                    remaining = remaining.subtract(scaledAmount);
                }
                refund.setRefundAmount(scaledAmount);
                refundRepository.save(refund);

                int alreadyRefunded = item.getRefundedQuantity() == null
                        ? 0 : item.getRefundedQuantity();
                item.setRefundedQuantity(
                        alreadyRefunded + refund.getRefundQuantity()
                );
            }
        } else {
            for (Refund refund : pendingRefunds) {
                TransactionItem item = refund.getTransactionItem();
                refundRepository.save(refund);

                int alreadyRefunded = item.getRefundedQuantity() == null
                        ? 0 : item.getRefundedQuantity();
                item.setRefundedQuantity(
                        alreadyRefunded + refund.getRefundQuantity()
                );
            }
        }

        updateTransactionRefundStatus(
                request.getItems().get(0)
                        .getTransactionItemId()
        );

        int count = request.getItems().size();

        if (count == 1) {
            transactionAuditHelper.logRefund(refundItems.get(0));
        } else {
            transactionAuditHelper.logRefundBatch(refundItems);
        }
    }

    private String generateTransactionNumber() {
        String prefix = "TXN-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        String maxNumber = transactionRepository.findMaxTransactionNumberByPrefix(prefix);
        if (maxNumber == null) {
            return prefix + "0001";
        }
        int seq = Integer.parseInt(maxNumber.substring(maxNumber.lastIndexOf('-') + 1));
        return prefix + String.format("%04d", seq + 1);
    }

    private void updateTransactionRefundStatus(
            UUID transactionItemId
    ) {

        Transaction txn =
                transactionItemRepository
                        .findById(transactionItemId)
                        .orElseThrow()
                        .getTransaction();

        boolean allRefunded =
                txn.getTransactionItems().stream()
                        .allMatch(i ->
                                i.getRefundedQuantity() != null &&
                                        i.getRefundedQuantity()
                                                .equals(i.getQuantity())
                        );

        boolean anyRefunded =
                txn.getTransactionItems().stream()
                        .anyMatch(i ->
                                i.getRefundedQuantity() != null &&
                                        i.getRefundedQuantity() > 0
                        );

        if (allRefunded) {
            txn.setTransactionStatus(
                    TransactionStatus.FULLY_REFUNDED
            );
        } else if (anyRefunded) {
            txn.setTransactionStatus(
                    TransactionStatus.PARTIALLY_REFUNDED
            );
        }
    }

    private TransactionStatus computeStatus(BigDecimal totalAmount, BigDecimal amountPaid) {
        if (amountPaid.compareTo(BigDecimal.ZERO) == 0) {
            return TransactionStatus.PENDING;
        } else if (amountPaid.compareTo(totalAmount) >= 0) {
            return TransactionStatus.PAID;
        } else {
            return TransactionStatus.PARTIALLY_PAID;
        }
    }

    private TransactionResponseDTO enrichWithPayments(TransactionResponseDTO dto) {
        List<PaymentResponseDTO> paymentDTOs = paymentRepository
                .findByTransactionTransactionIdOrderByCreatedAtDesc(dto.getTransactionId())
                .stream().map(p -> {
                    PaymentResponseDTO pd = new PaymentResponseDTO();
                    pd.setId(p.getId());
                    pd.setAmount(p.getAmount());
                    pd.setPaymentMethod(p.getPaymentMethod().name());
                    pd.setReferenceNumber(p.getReferenceNumber());
                    pd.setCreatedAt(p.getCreatedAt());
                    return pd;
                }).collect(Collectors.toList());
        dto.setPayments(paymentDTOs);
        return dto;
    }
}
