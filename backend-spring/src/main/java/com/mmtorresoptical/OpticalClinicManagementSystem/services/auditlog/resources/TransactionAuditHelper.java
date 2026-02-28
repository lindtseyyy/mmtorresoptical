package com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transaction.TransactionAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transactionitem.TransactionItemAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.TransactionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.TransactionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Transaction;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionAuditHelper {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final TransactionMapper transactionMapper;
    private final TransactionItemMapper transactionItemMapper;

    public void logCreate(Transaction transaction) {

        TransactionAuditDTO auditDTO =
                transactionMapper.entityToAuditDTO(transaction);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.CREATE,
                ResourceType.TRANSACTION,
                transaction.getTransactionId(),
                "Created transaction record",
                detailsJson
        );
    }

    public void logVoid(Transaction transaction) {

        TransactionAuditDTO auditDTO =
                transactionMapper.entityToAuditDTO(transaction);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.VOID,
                ResourceType.TRANSACTION,
                transaction.getTransactionId(),
                "Void transaction record",
                detailsJson
        );
    }

    public void logRefund(TransactionItem transactionItem) {

        TransactionItemAuditDTO auditDTO =
                transactionItemMapper.entityToAuditDTO(transactionItem);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.REFUND,
                ResourceType.TRANSACTION_ITEMS,
                transactionItem.getTransactionItemId(),
                "Void transaction item record",
                detailsJson
        );
    }

    public void logRefundBatch(List<TransactionItem> transactionItems) {

        List<TransactionItemAuditDTO> auditDTO =
                transactionItemMapper.entityListToAuditDTOList(transactionItems);

        int count = transactionItems.size();

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.REFUND,
                ResourceType.TRANSACTION_ITEMS,
                transactionItems.get(0).getTransaction().getTransactionId(),
                "Void " + count + " transaction items records",
                detailsJson
        );
    }
}