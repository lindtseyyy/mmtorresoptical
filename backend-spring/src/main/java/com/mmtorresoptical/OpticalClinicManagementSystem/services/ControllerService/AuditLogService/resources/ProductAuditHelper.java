package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService.resources;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.base.update.AuditUpdateEvent;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.product.ProductAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ActionType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ResourceType;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.ProductMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService.AuditLogService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService.AuditLogService.BatchAuditLogHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.helper.JSONService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductAuditHelper implements BatchAuditLogHelper<Product> {

    private final AuditLogService auditLogService;
    private final JSONService jsonService;
    private final ProductMapper productMapper;

    @Override
    public void logCreate(Product product) {

        ProductAuditDTO auditDTO =
                productMapper.entityToAuditDTO(product);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PRODUCT,
                product.getProductId(),
                "Created product record",
                detailsJson
        );
    }

    @Override
    public void logCreateBatch(List<Product> products) {
        List<ProductAuditDTO> auditDTOs =
                productMapper.entityListToAuditDTOList(products);

        int count = products.size();

        String detailsJson = jsonService.toJson(auditDTOs);
        auditLogService.log(ActionType.CREATE,
                ResourceType.PRODUCT,
                null,
                "Created " + count + " product records",
                detailsJson
        );
    }

    @Override
    public void logUpdate(Product beforeProduct, Product afterProduct) {

        ProductAuditDTO before =
                productMapper.entityToAuditDTO(beforeProduct);

        ProductAuditDTO after =
                productMapper.entityToAuditDTO(afterProduct);

        AuditUpdateEvent<ProductAuditDTO> event =
                new AuditUpdateEvent<>(before, after);

        String detailsJson = jsonService.toJson(event);
        auditLogService.log(ActionType.UPDATE,
                ResourceType.PRODUCT,
                after.getProductId(),
                "Updated product record",
                detailsJson
        );
    }

    @Override
    public void logArchive(Product product) {

        ProductAuditDTO auditDTO =
                productMapper.entityToAuditDTO(product);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.ARCHIVE,
                ResourceType.PRODUCT,
                product.getProductId(),
                "Archived product record",
                detailsJson
        );
    }

    @Override
    public void logRestore(Product product) {

        ProductAuditDTO auditDTO =
                productMapper.entityToAuditDTO(product);

        String detailsJson = jsonService.toJson(auditDTO);
        auditLogService.log(ActionType.RESTORE,
                ResourceType.PRODUCT,
                product.getProductId(),
                "Restored product record",
                detailsJson
        );
    }

}