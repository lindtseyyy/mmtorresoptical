package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.TransactionMetricsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment.PaymentRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment.PaymentResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.ItemRefundResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundTransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundItemDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.DiscountType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentMethod;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.RefundStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.InsufficientStockException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.TransactionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.TransactionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.TransactionAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
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
import java.util.*;
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
    private final RefundItemRepository refundItemRepository;
    private final RefundReceiptRepository refundReceiptRepository;
    private final PaymentRepository paymentRepository;
    private final TransactionAuditHelper transactionAuditHelper;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;
    private final JSONService jsonService;

    @Transactional
    public TransactionResponseDTO createTransaction(TransactionRequestDTO transactionRequestDTO) {
        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Patient patient = null;

        if (transactionRequestDTO.getPatientId() != null) {
            UUID patientId = transactionRequestDTO.getPatientId();
            patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

            // Default estimated ready date for patient-associated orders
            if (transactionRequestDTO.getEstimatedReadyDate() == null) {
                transactionRequestDTO.setEstimatedReadyDate(LocalDate.now().plusDays(3));
            }
        } else {
            // Walk-in retail: force estimated ready date to null
            transactionRequestDTO.setEstimatedReadyDate(null);
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

        BigDecimal amountTendered = transactionRequestDTO.getAmountTendered();
        if (amountTendered == null) {
            amountTendered = BigDecimal.ZERO;
        }
        if (amountTendered.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("At least a deposit payment is required to create a transaction.");
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
            Payment savedPayment = paymentRepository.save(payment);
            if (savedTransaction.getPayments() == null) {
                savedTransaction.setPayments(new java.util.ArrayList<>());
            }
            savedTransaction.getPayments().add(savedPayment);
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

        if (transaction.getRefundStatus() == RefundStatus.FULL) {
            throw new IllegalStateException("Cannot add payment to a fully refunded transaction");
        }

        BigDecimal refundedCash = transaction.getTotalRefundedCash() != null
                ? transaction.getTotalRefundedCash() : BigDecimal.ZERO;
        BigDecimal remaining = transaction.getTotalAmount()
                .subtract(transaction.getAmountPaid())
                .add(refundedCash);
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

        transactionAuditHelper.logPayment(transaction);

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
            RefundStatus refundStatus,
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

        if (refundStatus != null) {
            spec = spec.and(TransactionSpecification.hasRefundStatus(refundStatus));
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
        BigDecimal totalRefundedAmount = refundReceiptRepository.sumTotalRefundAmount();
        BigDecimal totalRevenue = grossRevenue.subtract(totalRefundedAmount);

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);

        long todayTransactions = transactionRepository.countByTransactionStatusNotAndTransactionDateBetween(TransactionStatus.VOIDED, startOfToday, startOfTomorrow);

        BigDecimal todayGrossRevenue = transactionRepository.sumTotalAmountByTransactionDateBetweenExcludingStatus(startOfToday, startOfTomorrow, TransactionStatus.VOIDED);
        BigDecimal todayTotalRefundedAmount = refundReceiptRepository.sumRefundAmountByCreatedAtBetween(startOfToday, startOfTomorrow);
        BigDecimal todayRevenue = todayGrossRevenue.subtract(todayTotalRefundedAmount);

        BigDecimal averageTransactionValue = totalTransactions > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfNextMonth = startOfMonth.plusMonths(1);

        long totalTransactionsThisMonth = transactionRepository.countByTransactionStatusNotAndTransactionDateBetween(TransactionStatus.VOIDED, startOfMonth, startOfNextMonth);

        BigDecimal totalRefundedAmountThisMonth = refundReceiptRepository.sumRefundAmountByCreatedAtBetween(startOfMonth, startOfNextMonth);

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

        if (transaction.getTransactionStatus() == TransactionStatus.REFUNDED) {
            throw new IllegalStateException("Cannot void a fully refunded transaction");
        }

        if (transaction.getRefundStatus() == RefundStatus.FULL) {
            throw new IllegalStateException("Cannot void a fully refunded transaction");
        }

        if (transaction.getRefundStatus() == RefundStatus.PARTIAL) {
            throw new IllegalStateException("Cannot void a partially refunded transaction");
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
    public ItemRefundResponseDTO refundTransaction(
            RefundTransactionRequestDTO request
    ) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("At least one item is required for refund.");
        }

        User currentUser = authenticatedUserService.getCurrentUser();

        // ── Phase 1: Validate all items, calculate refund amounts, sum totalRefundValue ──
        List<RefundItem> pendingItems = new ArrayList<>();
        List<TransactionItem> refundItems = new ArrayList<>();
        Transaction transaction = null;
        BigDecimal totalRefundValue = BigDecimal.ZERO;

        for (RefundItemDTO dto : request.getItems()) {
            TransactionItem item = transactionItemRepository.findById(dto.getTransactionItemId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Transaction item not found: " + dto.getTransactionItemId()));

            if (transaction == null) {
                transaction = item.getTransaction();
            } else if (!transaction.getTransactionId().equals(item.getTransaction().getTransactionId())) {
                throw new BadRequestException("All refund items must belong to the same transaction.");
            }

            refundItems.add(item);

            if (transaction.getTransactionStatus() == TransactionStatus.VOIDED
                    || transaction.getTransactionStatus() == TransactionStatus.REFUNDED) {
                throw new IllegalStateException("Cannot refund a voided or fully refunded transaction.");
            }

            if (transaction.getRefundStatus() == RefundStatus.FULL) {
                throw new IllegalStateException("Transaction is already fully refunded.");
            }

            int alreadyRefunded = item.getRefundedQuantity() == null ? 0 : item.getRefundedQuantity();
            int newRefundQty = dto.getRefundQuantity();

            if (alreadyRefunded + newRefundQty > item.getQuantity()) {
                throw new IllegalArgumentException(
                        "Refund exceeds purchased quantity for: " + item.getProduct().getProductName());
            }

            // Calculate item credit amount (full invoice value, with pro-rated discount)
            BigDecimal itemCredit = item.getUnitPrice().multiply(BigDecimal.valueOf(newRefundQty));
            if (item.getDiscountType() != null && item.getDiscountValue() != null) {
                if (item.getDiscountType() == DiscountType.FIXED) {
                    BigDecimal discountPerUnit = item.getDiscountValue()
                            .divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP);
                    itemCredit = itemCredit.subtract(
                            discountPerUnit.multiply(BigDecimal.valueOf(newRefundQty)));
                } else if (item.getDiscountType() == DiscountType.PERCENT) {
                    BigDecimal percent = item.getDiscountValue()
                            .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                    itemCredit = itemCredit.subtract(
                            item.getUnitPrice().multiply(percent).multiply(BigDecimal.valueOf(newRefundQty)));
                }
            }

            totalRefundValue = totalRefundValue.add(itemCredit);

            RefundItem refundItem = new RefundItem();
            refundItem.setItemCreditAmount(itemCredit);
            refundItem.setTransactionItem(item);
            refundItem.setQuantityRefunded(newRefundQty);
            refundItem.setRefundReason(dto.getRefundReason());
            pendingItems.add(refundItem);
        }

        // Sum previous item credits for revised total calculation
        BigDecimal totalAllRefunded = BigDecimal.ZERO;
        if (transaction.getRefundReceipts() != null) {
            for (RefundReceipt receipt : transaction.getRefundReceipts()) {
                if (receipt.getRefundItems() != null) {
                    for (RefundItem ri : receipt.getRefundItems()) {
                        totalAllRefunded = totalAllRefunded.add(ri.getItemCreditAmount());
                    }
                }
            }
        }

        // Max refundable = amountPaid minus cash already returned via prior refunds
        BigDecimal previousRefundedCash = transaction.getTotalRefundedCash() != null
                ? transaction.getTotalRefundedCash() : BigDecimal.ZERO;
        BigDecimal maxRefundable = transaction.getAmountPaid().subtract(previousRefundedCash);
        if (maxRefundable.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Cannot refund: no paid amount available to refund.");
        }

        // Scale actual cash back proportionally if totalRefundValue exceeds payment cap
        BigDecimal scale = BigDecimal.ONE;
        if (totalRefundValue.compareTo(maxRefundable) > 0) {
            scale = maxRefundable.divide(totalRefundValue, 4, RoundingMode.HALF_UP);
        }

        BigDecimal actualRefundValue;
        if (scale.compareTo(BigDecimal.ONE) < 0) {
            actualRefundValue = maxRefundable;
        } else {
            actualRefundValue = totalRefundValue;
        }

        // ── Phase 2: Order-level accounting — cash-back vs. balance-reduction ──
        BigDecimal originalTotal = transaction.getTotalAmount();
        BigDecimal newOrderTotal = originalTotal.subtract(totalAllRefunded).subtract(actualRefundValue);
        BigDecimal amountPaid = transaction.getAmountPaid();
        BigDecimal cashToReturn;
        TransactionStatus previousStatus = transaction.getTransactionStatus();
        RefundStatus previousRefundStatus = transaction.getRefundStatus();

        if (amountPaid.compareTo(newOrderTotal) > 0) {
            cashToReturn = amountPaid.subtract(newOrderTotal).min(maxRefundable);
            BigDecimal newTotalRefundedCash = previousRefundedCash.add(cashToReturn);
            transaction.setTotalRefundedCash(newTotalRefundedCash);
            BigDecimal effectivePaid = amountPaid.subtract(newTotalRefundedCash);
            if (effectivePaid.compareTo(transaction.getTotalAmount()) >= 0
                    && previousStatus == TransactionStatus.COMPLETED) {
                transaction.setTransactionStatus(TransactionStatus.COMPLETED);
            } else {
                transaction.setTransactionStatus(computeStatus(newOrderTotal, effectivePaid));
            }
        } else {
            cashToReturn = BigDecimal.ZERO;
            BigDecimal effectivePaid = amountPaid.subtract(previousRefundedCash);
            transaction.setTransactionStatus(computeStatus(newOrderTotal, effectivePaid));
        }

        // Determine batch-level refund method and actual cashback
        String batchRefundMethod;
        BigDecimal batchActualCashback;
        if (cashToReturn.compareTo(BigDecimal.ZERO) == 0) {
            batchRefundMethod = "BALANCE_ADJUSTMENT";
            batchActualCashback = BigDecimal.ZERO;
        } else {
            batchRefundMethod = request.getRefundMethod();
            batchActualCashback = cashToReturn;
        }

        // ── Phase 3: Status & inventory updates ──
        boolean allItemsFullyRefunded = true;
        for (TransactionItem ti : transaction.getTransactionItems()) {
            int tiAlreadyRefunded = ti.getRefundedQuantity() == null ? 0 : ti.getRefundedQuantity();
            int tiNewRefunded = tiAlreadyRefunded;
            for (RefundItem pending : pendingItems) {
                if (pending.getTransactionItem().getTransactionItemId().equals(ti.getTransactionItemId())) {
                    tiNewRefunded += pending.getQuantityRefunded();
                }
            }
            if (tiNewRefunded < ti.getQuantity()) {
                allItemsFullyRefunded = false;
                break;
            }
        }

        if (allItemsFullyRefunded) {
            transaction.setRefundStatus(RefundStatus.FULL);
            transaction.setTransactionStatus(TransactionStatus.REFUNDED);
        } else {
            transaction.setRefundStatus(RefundStatus.PARTIAL);
        }

        // Create the RefundReceipt header
        RefundReceipt receipt = new RefundReceipt();
        receipt.setReceiptNumber(generateRefundReceiptNumber());
        receipt.setTransaction(transaction);
        receipt.setActualCashback(batchActualCashback);
        receipt.setRefundMethod(batchRefundMethod);
        receipt.setCreatedAt(LocalDateTime.now());
        receipt.setIssuedBy(currentUser);

        // Restore stock and build refund items linked to the receipt
        List<ItemRefundResponseDTO.RefundedItemSummary> itemSummaries = new ArrayList<>();
        for (RefundItem refundItem : pendingItems) {
            TransactionItem item = refundItem.getTransactionItem();
            Product product = item.getProduct();

            if (product.getProductType() == ProductType.PHYSICAL) {
                if ("Damaged".equalsIgnoreCase(refundItem.getRefundReason())) {
                    product.setDamagedQuantity(product.getDamagedQuantity() + refundItem.getQuantityRefunded());
                } else {
                    product.setQuantity(product.getQuantity() + refundItem.getQuantityRefunded());
                }
                productRepository.save(product);
            }

            refundItem.setRefundReceipt(receipt);
            receipt.getRefundItems().add(refundItem);

            int ar = item.getRefundedQuantity() == null ? 0 : item.getRefundedQuantity();
            item.setRefundedQuantity(ar + refundItem.getQuantityRefunded());

            itemSummaries.add(ItemRefundResponseDTO.RefundedItemSummary.builder()
                    .productName(product.getProductName())
                    .unitPrice(item.getUnitPrice())
                    .refundQuantity(refundItem.getQuantityRefunded())
                    .build());
        }

        refundReceiptRepository.save(receipt);
        transactionRepository.save(transaction);

        // ── Audit logging ──
        int itemCount = refundItems.size();
        String productNames = refundItems.stream()
                .map(i -> i.getProduct().getProductName())
                .reduce((a, b) -> a + ", " + b).orElse("");

        Map<String, Object> auditData = new LinkedHashMap<>();
        auditData.put("transactionId", transaction.getTransactionId().toString());
        auditData.put("transactionNumber", transaction.getTransactionNumber());
        auditData.put("refundReceiptNumber", receipt.getReceiptNumber());
        auditData.put("itemCount", itemCount);
        auditData.put("products", productNames);
        auditData.put("totalRefundValue", actualRefundValue);
        auditData.put("refundMethod", batchRefundMethod);
        auditData.put("beforeTotalAmount", originalTotal);
        auditData.put("afterTotalAmount", newOrderTotal);
        auditData.put("beforeAmountPaid", amountPaid);
        auditData.put("afterAmountPaid", transaction.getAmountPaid());
        auditData.put("totalRefundedCash", transaction.getTotalRefundedCash());
        auditData.put("cashReturnedToPatient", cashToReturn);
        auditData.put("beforeRefundStatus", previousRefundStatus != null
                ? previousRefundStatus.name() : RefundStatus.NONE.name());
        auditData.put("afterRefundStatus", transaction.getRefundStatus().name());
        auditData.put("beforeTransactionStatus", previousStatus.name());
        auditData.put("afterTransactionStatus", transaction.getTransactionStatus().name());

        auditLogService.log(
                com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType.REFUND,
                com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType.TRANSACTION,
                transaction.getTransactionId(),
                "Refund (" + itemCount + " item(s)): " + productNames
                        + " | Total refund value: " + actualRefundValue
                        + " | Cash returned: " + cashToReturn
                        + " | New total: " + newOrderTotal,
                jsonService.toJson(auditData)
        );

        // ── Build response ──
        BigDecimal effectiveAmountPaid = amountPaid.subtract(cashToReturn);
        BigDecimal newBalanceDue = newOrderTotal.subtract(effectiveAmountPaid).max(BigDecimal.ZERO);

        return ItemRefundResponseDTO.builder()
                .originalTotal(originalTotal)
                .newOrderTotal(newOrderTotal)
                .amountPaid(effectiveAmountPaid)
                .cashToReturn(cashToReturn)
                .newRemainingDue(newBalanceDue)
                .newTransactionStatus(transaction.getTransactionStatus().name())
                .newRefundStatus(transaction.getRefundStatus().name())
                .refundReceipt(ItemRefundResponseDTO.RefundReceiptData.builder()
                        .refundReceiptId(receipt.getRefundReceiptId())
                        .receiptNumber(receipt.getReceiptNumber())
                        .cashReturnedAmount(receipt.getActualCashback())
                        .dateIssued(receipt.getCreatedAt())
                        .issuedByFullName(currentUser.getFirstName() + " " + currentUser.getLastName())
                        .build())
                .refundedItems(itemSummaries)
                .build();
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

    private String generateRefundReceiptNumber() {
        String prefix = "REF-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        String maxNumber = refundReceiptRepository.findMaxReceiptNumberByPrefix(prefix);
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
            txn.setRefundStatus(
                    RefundStatus.FULL
            );
        } else if (anyRefunded) {
            txn.setRefundStatus(
                    RefundStatus.PARTIAL
            );
        }
    }

    private TransactionStatus computeStatus(BigDecimal totalAmount, BigDecimal amountPaid) {
        if (amountPaid.compareTo(totalAmount) >= 0) {
            return TransactionStatus.PAID;
        }
        return TransactionStatus.DEPOSIT;
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
