package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transactionitem.TransactionItemAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring",
uses = {RefundMapper.class})
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


    @Mapping(
            target = "productId",
            source = "product.productId"
    )
    TransactionItemAuditDTO entityToAuditDTO(TransactionItem transactionItem);

    @Mapping(
            target = "productId",
            source = "product.productId"
    )
    List<TransactionItemAuditDTO> entityListToAuditDTOList(List<TransactionItem> transactionItem);
}
