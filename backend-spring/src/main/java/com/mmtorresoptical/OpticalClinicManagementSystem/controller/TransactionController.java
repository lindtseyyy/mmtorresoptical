package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.AgingReceivableDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics.TransactionMetricsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment.PaymentRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment.PaymentResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.ItemRefundResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundTransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.RefundStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponseDTO> createTransaction(@Valid @RequestBody TransactionRequestDTO transactionRequestDTO) {

        TransactionResponseDTO transactionResponseDTO = transactionService.createTransaction(transactionRequestDTO);

        return ResponseEntity.ok(transactionResponseDTO);
    }

    @GetMapping
    public ResponseEntity<Page<TransactionListDTO>> getAllTransactions(
            @RequestParam(required = false) String keyword,

            @RequestParam(required = false) LocalDate minDate,
            @RequestParam(required = false) LocalDate maxDate,

            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) RefundStatus refundStatus,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,

            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder
    ) {

        List<String> allowedSortFields = List.of(
                "transactionDate",
                "totalAmount"
        );

        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "transactionDate";
        }


        Page<TransactionListDTO> transactionListDTOS = transactionService.getAllTransactions(
                keyword,
                minDate,
                maxDate,
                status,
                refundStatus,
                null,
                page,
                size,
                sortBy,
                sortOrder
        );

        return ResponseEntity.ok(transactionListDTOS);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDetailsDTO> getTransaction(
            @PathVariable UUID id
    ) {
        TransactionDetailsDTO transaction = transactionService.getTransaction(id);

        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<Void> voidTransaction(
            @PathVariable UUID id, @Valid @RequestBody VoidTransactionRequestDTO voidTransactionRequestDTO
    ) {
        transactionService.voidTransaction(id, voidTransactionRequestDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/metrics")
    public ResponseEntity<TransactionMetricsDTO> getTransactionMetrics() {
        return ResponseEntity.ok(transactionService.getTransactionMetrics());
    }

    @GetMapping("/accounts-receivable")
    public ResponseEntity<List<AgingReceivableDTO>> getAgingAccountsReceivable() {
        return ResponseEntity.ok(transactionService.getAgingAccountsReceivable());
    }

    @PostMapping("/refund")
    public ResponseEntity<ItemRefundResponseDTO> refundTransaction(
            @RequestBody RefundTransactionRequestDTO request
    ) {
        ItemRefundResponseDTO response = transactionService.refundTransaction(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<PaymentResponseDTO> addPayment(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentRequestDTO request
    ) {
        PaymentResponseDTO payment = transactionService.addPayment(id, request);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<PaymentResponseDTO>> getPayments(
            @PathVariable UUID id
    ) {
        List<PaymentResponseDTO> payments = transactionService.getPaymentsForTransaction(id);
        return ResponseEntity.ok(payments);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<TransactionResponseDTO> completeTransaction(
            @PathVariable UUID id
    ) {
        TransactionResponseDTO transaction = transactionService.completeTransaction(id);
        return ResponseEntity.ok(transaction);
    }

}
