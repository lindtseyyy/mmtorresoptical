package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transaction.TransactionAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionListDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring",
        uses = {UserMapper.class, PatientMapper.class, TransactionItemMapper.class})
public interface TransactionMapper {

    @Mapping(target = "transactionId", ignore = true)
    @Mapping(target = "transactionNumber", ignore = true)
    @Mapping(target = "transactionDate", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "transactionStatus", ignore = true)
    @Mapping(target = "amountPaid", ignore = true)
    @Mapping(target = "balanceDue", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    @Mapping(target = "voidedAt", ignore = true)
    @Mapping(target = "voidReason", ignore = true)
    @Mapping(target = "voidedBy", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "patient", ignore = true)
    @Mapping(target = "transactionItems", ignore = true)
    @Mapping(target = "payments", ignore = true)
    Transaction requestDTOtoEntity(TransactionRequestDTO transactionRequestDTO);

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    @Mapping(
            target = "patient",
            source = "patient"
    )
    @Mapping(
            target = "transactionStatus",
            expression = "java(transaction.getTransactionStatus().name())"
    )
    @Mapping(
            target = "refundStatus",
            expression = "java(transaction.getRefundStatus().name())"
    )
    TransactionDetailsDTO entityToDetailsDTO(Transaction transaction);

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    @Mapping(
            target = "patient",
            source = "patient"
    )
    @Mapping(
            target = "transactionStatus",
            expression = "java(transaction.getTransactionStatus().name())"
    )
    @Mapping(
            target = "refundStatus",
            expression = "java(transaction.getRefundStatus().name())"
    )
    TransactionResponseDTO entityToResponseDTO(Transaction transaction);

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    @Mapping(
            target = "patient",
            source = "patient"
    )
    @Mapping(
            target = "transactionStatus",
            expression = "java(transaction.getTransactionStatus().name())"
    )
    @Mapping(
            target = "refundStatus",
            expression = "java(transaction.getRefundStatus().name())"
    )
    TransactionListDTO entityToListDTO(Transaction transaction);

    @Mapping(
            target = "voidedByUserId",
            source = "voidedBy.userId"
    )
    @Mapping(
            target = "patientId",
            source = "patient.patientId"
    )
    @Mapping(
            target = "createdByUserId",
            source = "user.userId"
    )
    TransactionAuditDTO entityToAuditDTO(Transaction transaction);
}
