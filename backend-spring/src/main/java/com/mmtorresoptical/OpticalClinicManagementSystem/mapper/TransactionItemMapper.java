package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;

@Mapper(componentModel = "spring",
uses = {TransactionItem.class, RefundMapper.class})
public interface TransactionItemMapper {

    TransactionItem requestDTOtoEntity(TransactionItemsRequestDTO transactionItemsRequestDTO);

    @Mapping(
            target = "discountType",
            expression = "java(transactionItem.getDiscountType().name())"
    )
    @Mapping(
            target = "subtotal",
            source = "subtotal"
    )
    TransactionItemResponseDTO entityToResponseDTO(TransactionItem transactionItem);


}
