package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundTransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundItemDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    private final TransactionAuditHelper transactionAuditHelper;

    @Transactional
    public TransactionResponseDTO createTransaction(TransactionRequestDTO transactionRequestDTO) {
        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Patient patient = null;

        if(transactionRequestDTO.getPatientId() != null) {
            UUID patientId = transactionRequestDTO.getPatientId();
            // Retrieve patient or throw exception if not found
            patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        }

        String ref = transactionRequestDTO.getReferenceNumber();

        if (ref != null &&
                transactionRepository.existsByReferenceNumber(ref)) {

            throw new BadRequestException("Reference number already used");
        }

        Transaction transaction = transactionMapper.requestDTOtoEntity(transactionRequestDTO);

        transaction.setUser(authenticatedUser);
        transaction.setPatient(patient);

        List<TransactionItem> transactionItems = transactionRequestDTO.getItems()
                .stream().map(dto -> {

                    // Retrieve prescription or throw exception if not found
                    Product retrievedProduct = productRepository.findById(dto.getProductId())
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + dto.getProductId()));

                    // Check stock first
                    if (retrievedProduct.getQuantity() < dto.getQuantity()) {
                        throw new InsufficientStockException(
                                "Not enough stock for product: "
                                        + retrievedProduct.getProductName()
                        );
                    }

                    // Deduct the stock
                    retrievedProduct.setQuantity(
                            retrievedProduct.getQuantity() - dto.getQuantity()
                    );

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
                                    .divide(BigDecimal.valueOf(100), 2,  // scale (decimal places)
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

        transaction.setTransactionStatus(TransactionStatus.COMPLETED);

        Transaction savedTransaction = transactionRepository.saveAndFlush(transaction);

        // Audit Logging
        transactionAuditHelper.logCreate(savedTransaction);

        return transactionMapper.entityToResponseDTO(savedTransaction);
    }

    public Page<TransactionListDTO> getAllTransactions(
            String keyword,
            LocalDate minDate,
            LocalDate maxDate,
            PaymentType paymentType,
            TransactionStatus status,
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

        // Determine sorting direction from request parameter
        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            // Default to descending if invalid input
            direction = Sort.Direction.DESC;
        }

        Specification<Transaction> spec = Specification.allOf();

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    TransactionSpecification.dateBetween(minDate, maxDate)
            );
        }

        if (paymentType != null) {
            spec = spec.and(TransactionSpecification.hasPaymentType(paymentType));
        }

        if (status != null) {
            spec = spec.and(TransactionSpecification.hasTransactionStatus(status));
        }

        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Transaction> transactions = transactionRepository.findAll(spec, pageable);

        return transactions.map(transactionMapper::entityToListDTO);
    }

    public TransactionDetailsDTO getTransaction(UUID id) {
        // Retrieve transaction or throw exception if not found
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        return transactionMapper.entityToDetailsDTO(transaction);
    }

    @Transactional
    public void voidTransaction(UUID transactionId, VoidTransactionRequestDTO voidTransactionRequestDTO) {

        // Retrieve transaction or throw exception if not found
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + transactionId));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        if (transaction.getTransactionStatus() == TransactionStatus.VOIDED) {
            throw new IllegalStateException("Transaction already voided");
        }

        if (transaction.getTransactionStatus() == TransactionStatus.FULLY_REFUNDED) {
            throw new IllegalStateException("Cannot void refunded transaction");
        }

        if (transaction.getTransactionStatus() != TransactionStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Only completed transactions can be voided"
            );
        }

        for (TransactionItem item : transaction.getTransactionItems()) {

            Product product = item.getProduct();

            product.setQuantity(
                    product.getQuantity() + item.getQuantity()
            );
        }

        transaction.setTransactionStatus(TransactionStatus.VOIDED);

        transaction.setVoidedBy(authenticatedUser);
        transaction.setVoidedAt(LocalDateTime.now());
        transaction.setVoidReason(voidTransactionRequestDTO.getReason());
    }

    @Transactional
    public void refundTransaction(
            RefundTransactionRequestDTO request
    ) {

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

            Transaction txn = item.getTransaction();

            // Block voided txn
            if (txn.getTransactionStatus() == TransactionStatus.VOIDED) {
                throw new IllegalStateException(
                        "Cannot refund voided transaction"
                );
            }

            // Current refunded qty
            int alreadyRefunded =
                    item.getRefundedQuantity() == null
                            ? 0
                            : item.getRefundedQuantity();

            int newRefundQty = dto.getRefundQuantity();

            // Prevent over-refund
            if (alreadyRefunded + newRefundQty > item.getQuantity()) {
                throw new IllegalArgumentException(
                        "Refund exceeds purchased quantity"
                );
            }

            // Restore stock
            Product product = item.getProduct();
            product.setQuantity(
                    product.getQuantity() + newRefundQty
            );

            // 🆕 Create Refund record
            BigDecimal unitPrice = item.getUnitPrice();

            BigDecimal refundAmount =
                    unitPrice.multiply(
                            BigDecimal.valueOf(dto.getRefundQuantity())
                    );

            // Optional: discount proration
            if (item.getDiscountValue() != null) {

                BigDecimal discountPerUnit =
                        item.getDiscountValue()
                                .divide(
                                        BigDecimal.valueOf(item.getQuantity()),
                                        RoundingMode.HALF_UP
                                );

                BigDecimal refundDiscount =
                        discountPerUnit.multiply(
                                BigDecimal.valueOf(dto.getRefundQuantity())
                        );

                refundAmount =
                        refundAmount.subtract(refundDiscount);
            }

            Refund refund = new Refund();

            refund.setRefundAmount(refundAmount);
            refund.setTransactionItem(item);
            refund.setRefundQuantity(newRefundQty);
            refund.setRefundReason(dto.getRefundReason());
            refund.setRefundedAt(LocalDateTime.now());
            refund.setUser(authenticatedUserService.getCurrentUser());

            refundRepository.save(refund);

            // 📝 Update refunded qty
            item.setRefundedQuantity(
                    alreadyRefunded + newRefundQty
            );
        }

        // 🔄 Update transaction refund status
        updateTransactionRefundStatus(
                request.getItems().get(0)
                        .getTransactionItemId()
        );
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
        }
        else if (anyRefunded) {
            txn.setTransactionStatus(
                    TransactionStatus.PARTIALLY_REFUNDED
            );
        }
    }

}
