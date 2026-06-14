package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundReceiptDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.RefundItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.RefundItemBatchDetail;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.RefundReceipt;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RefundReceiptMapper {

    @Mapping(target = "issuedByFullName", expression = "java(receipt.getIssuedBy().getFirstName() + \" \" + receipt.getIssuedBy().getLastName())")
    @Mapping(target = "refundItems", source = "refundItems")
    RefundReceiptDTO entityToDTO(RefundReceipt receipt);

    @Mapping(target = "refundItemId", source = "refundItemId")
    @Mapping(target = "productName", expression = "java(item.getTransactionItem().getProduct().getProductName())")
    @Mapping(target = "unitPrice", source = "transactionItem.unitPrice")
    @Mapping(target = "quantityRefunded", source = "quantityRefunded")
    @Mapping(target = "refundReason", source = "refundReason")
    @Mapping(target = "itemCreditAmount", source = "itemCreditAmount")
    @Mapping(target = "batchDetails", source = "batchDetails")
    RefundReceiptDTO.RefundItemDataDTO itemToDTO(RefundItem item);

    @Mapping(target = "batchNumber", source = "productBatch.batchNumber")
    @Mapping(target = "quantityRestored", source = "quantityRestored")
    RefundReceiptDTO.BatchDetailDTO batchDetailToDTO(RefundItemBatchDetail detail);

    List<RefundReceiptDTO> entityListToDTOList(List<RefundReceipt> receipts);
}
