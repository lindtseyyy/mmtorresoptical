package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundTransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.TransactionService;
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

            @RequestParam(required = false) PaymentType paymentType,
            @RequestParam(required = false) TransactionStatus status,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,

            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder
    ) {

        List<String> allowedSortFields = List.of(
                "transactionDate",
                "totalAmount",
                "paymentType",
                "status"
        );

        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "transactionDate";
        }


        Page<TransactionListDTO> transactionListDTOS = transactionService.getAllTransactions(
                keyword,
                minDate,
                maxDate,
                paymentType,
                status,
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

    @PostMapping("/refund")
    public ResponseEntity<Void> refundTransaction(
            @RequestBody RefundTransactionRequestDTO request
    ) {
        transactionService.refundTransaction(request);
        return ResponseEntity.ok().build();
    }

}
