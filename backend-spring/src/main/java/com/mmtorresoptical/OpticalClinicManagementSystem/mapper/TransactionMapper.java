package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionListDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction.TransactionResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;

@Mapper(componentModel = "spring",
uses = {UserMapper.class, PatientMapper.class})
public interface TransactionMapper {

    Transaction requestDTOtoEntity(TransactionRequestDTO transactionRequestDTO);

    @Mapping(
            target = "paymentType",
            expression = "java(transaction.getPaymentType().name())"
    )
    @Mapping(
            target = "createdBy",
            source = "user"

    )
    @Mapping(
            target = "patient",
            source = "patient"

    )
    @Mapping(
            target = "change",
            expression = "java(transaction.getCashTender() != null ? calculateChange(transaction.getCashTender(), transaction.getTotalAmount()) : null)"
    )
    @Mapping(
            target = "transactionStatus",
            expression = "java(transaction.getTransactionStatus().name())"
    )
    TransactionDetailsDTO entityToDetailsDTO(Transaction transaction);

    @Mapping(
            target = "paymentType",
            expression = "java(transaction.getPaymentType().name())"
    )
    @Mapping(
            target = "createdBy",
            source = "user"

    )
    @Mapping(
            target = "patient",
            source = "patient"
    )
    @Mapping(
            target = "change",
            expression = "java(transaction.getCashTender() != null ? calculateChange(transaction.getCashTender(), transaction.getTotalAmount()) : null)"
    )
    @Mapping(
            target = "transactionStatus",
            expression = "java(transaction.getTransactionStatus().name())"
    )
    TransactionResponseDTO entityToResponseDTO(Transaction transaction);

    @Mapping(
            target = "paymentType",
            expression = "java(transaction.getPaymentType().name())"
    )
    @Mapping(
            target = "createdBy",
            source = "user"

    )
    @Mapping(
            target = "patient",
            source = "patient"
    )
    @Mapping(
            target = "change",
            expression = "java(transaction.getCashTender() != null ? calculateChange(transaction.getCashTender(), transaction.getTotalAmount()) : null)"
    )
    @Mapping(
            target = "transactionStatus",
            expression = "java(transaction.getTransactionStatus().name())"
    )
    @Mapping(
            target = "transactionDate",
            source = "transactionDate"
    )
    TransactionListDTO entityToListDTO(Transaction transaction);

    default BigDecimal calculateChange(BigDecimal cashTender, BigDecimal totalAmount) {
        return cashTender.subtract(totalAmount);
    }
}