package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transactionitem.TransactionItemAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TransactionItemMapper {

    TransactionItem requestDTOtoEntity(TransactionItemsRequestDTO transactionItemsRequestDTO);

    @Mapping(
            target = "discountType",
            expression = "java(transactionItem.getDiscountType() != null ? transactionItem.getDiscountType().name() : null)"
    )
    @Mapping(
            target = "isDiscounted",
            expression = "java(transactionItem.getDiscountType() != null)"
    )
    @Mapping(
            target = "subtotal",
            source = "subtotal"
    )
    TransactionItemResponseDTO entityToResponseDTO(TransactionItem transactionItem);

    @Mapping(
            target = "discountType",
            expression = "java(transactionItem.getDiscountType() != null ? transactionItem.getDiscountType().name() : null)"
    )
    @Mapping(
            target = "isDiscounted",
            expression = "java(transactionItem.getDiscountType() != null)"
    )
    TransactionItemDetailsDTO entityToDetailsDTO(TransactionItem transactionItem);


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
