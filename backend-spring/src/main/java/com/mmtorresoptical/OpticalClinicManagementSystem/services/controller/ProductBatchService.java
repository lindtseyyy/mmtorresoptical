package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch.AddStockRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch.ProductBatchDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch.RemoveStockRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.InsufficientStockException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Product;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.ProductBatch;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.TransactionItemBatchAllocation;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductBatchRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.TransactionItemBatchAllocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductBatchService {

    private final ProductBatchRepository productBatchRepository;
    private final TransactionItemBatchAllocationRepository allocationRepository;
    private final ProductRepository productRepository;

    public record BatchAllocation(Long productBatchId, int quantity) {}

    @Transactional
    public ProductBatch addStock(UUID productId, AddStockRequestDTO request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        boolean isPerishable = product.getCategory().getIsPerishable();

        LocalDate expiryDate = isPerishable ? request.getExpiryDate() : null;

        ProductBatch batch = new ProductBatch();
        batch.setProduct(product);
        batch.setBatchNumber(request.getBatchNumber());
        batch.setQuantityReceived(request.getQuantity());
        batch.setQuantityRemaining(request.getQuantity());
        batch.setQuantityDamaged(0);
        batch.setExpiryDate(expiryDate);
        batch.setReceivedDate(LocalDate.now());

        productBatchRepository.save(batch);
        syncProductQuantity(productId);

        return batch;
    }

    @Transactional
    public void removeStock(UUID productId, RemoveStockRequestDTO request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        boolean isPerishable = product.getCategory().getIsPerishable();

        if (isPerishable) {
            if (request.getProductBatchId() == null) {
                throw new IllegalArgumentException("Batch selection is required for perishable products");
            }
            removeFromSpecificBatch(request.getProductBatchId(), request.getQuantity());
        } else {
            removeFifo(productId, request.getQuantity());
        }

        syncProductQuantity(productId);
    }

    public List<BatchAllocation> allocateFefo(UUID productId, int quantity) {
        List<ProductBatch> batches = productBatchRepository.findActiveBatchesFefo(productId);
        List<BatchAllocation> allocations = new ArrayList<>();
        int remaining = quantity;

        for (ProductBatch batch : batches) {
            if (remaining <= 0) break;
            int take = Math.min(remaining, batch.getQuantityRemaining());
            allocations.add(new BatchAllocation(batch.getProductBatchId(), take));
            remaining -= take;
        }

        if (remaining > 0) {
            throw new InsufficientStockException(
                    "Not enough stock. Requested: " + quantity + ", available: " + (quantity - remaining));
        }

        return allocations;
    }

    @Transactional
    public void commitAllocation(TransactionItem item, List<BatchAllocation> allocations) {
        for (BatchAllocation alloc : allocations) {
            ProductBatch batch = productBatchRepository.findById(alloc.productBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + alloc.productBatchId()));

            batch.setQuantityRemaining(batch.getQuantityRemaining() - alloc.quantity());
            productBatchRepository.save(batch);

            TransactionItemBatchAllocation record = new TransactionItemBatchAllocation();
            record.setTransactionItem(item);
            record.setProductBatch(batch);
            record.setQuantityDeducted(alloc.quantity());
            allocationRepository.save(record);
        }

        syncProductQuantity(item.getProduct().getProductId());
    }

    @Transactional
    public void restoreForVoid(TransactionItem item) {
        List<TransactionItemBatchAllocation> allocations =
                allocationRepository.findByTransactionItemId(item.getTransactionItemId());

        for (TransactionItemBatchAllocation alloc : allocations) {
            ProductBatch batch = alloc.getProductBatch();
            batch.setQuantityRemaining(batch.getQuantityRemaining() + alloc.getQuantityDeducted());
            productBatchRepository.save(batch);
        }

        syncProductQuantity(item.getProduct().getProductId());
    }

    @Transactional
    public void restoreForRefund(TransactionItem item, int refundQuantity, boolean isDamaged) {
        List<TransactionItemBatchAllocation> allocations =
                allocationRepository.findByTransactionItemId(item.getTransactionItemId());

        int remaining = refundQuantity;

        for (TransactionItemBatchAllocation alloc : allocations) {
            if (remaining <= 0) break;

            ProductBatch batch = alloc.getProductBatch();
            int canRestore = Math.min(remaining, alloc.getQuantityDeducted());

            if (isDamaged) {
                batch.setQuantityDamaged(batch.getQuantityDamaged() + canRestore);
            } else {
                batch.setQuantityRemaining(batch.getQuantityRemaining() + canRestore);
            }

            alloc.setQuantityDeducted(alloc.getQuantityDeducted() - canRestore);
            productBatchRepository.save(batch);
            allocationRepository.save(alloc);

            remaining -= canRestore;
        }

        syncProductQuantity(item.getProduct().getProductId());
    }

    public List<ProductBatchDTO> getBatchBreakdown(UUID productId) {
        List<ProductBatch> batches = productBatchRepository.findAllByProductId(productId);
        LocalDate today = LocalDate.now();

        return batches.stream()
                .map(batch -> {
                    String status = computeBatchStatus(batch, today);
                    return ProductBatchDTO.builder()
                            .productBatchId(batch.getProductBatchId())
                            .batchNumber(batch.getBatchNumber())
                            .quantityReceived(batch.getQuantityReceived())
                            .quantityRemaining(batch.getQuantityRemaining())
                            .quantityDamaged(batch.getQuantityDamaged())
                            .expiryDate(batch.getExpiryDate())
                            .receivedDate(batch.getReceivedDate())
                            .status(status)
                            .build();
                })
                .toList();
    }

    public List<ProductBatchDTO> getAvailableBatchesForDropdown(UUID productId) {
        List<ProductBatch> batches = productBatchRepository.findAvailableBatchesForProduct(productId);
        LocalDate today = LocalDate.now();

        return batches.stream()
                .map(batch -> ProductBatchDTO.builder()
                        .productBatchId(batch.getProductBatchId())
                        .batchNumber(batch.getBatchNumber())
                        .quantityReceived(batch.getQuantityReceived())
                        .quantityRemaining(batch.getQuantityRemaining())
                        .quantityDamaged(batch.getQuantityDamaged())
                        .expiryDate(batch.getExpiryDate())
                        .receivedDate(batch.getReceivedDate())
                        .status(computeBatchStatus(batch, today))
                        .build())
                .toList();
    }

    private void removeFromSpecificBatch(Long batchId, int quantity) {
        ProductBatch batch = productBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + batchId));

        if (batch.getQuantityRemaining() < quantity) {
            throw new InsufficientStockException(
                    "Insufficient stock in batch. Available: " + batch.getQuantityRemaining()
                            + ", requested removal: " + quantity);
        }

        batch.setQuantityRemaining(batch.getQuantityRemaining() - quantity);
        productBatchRepository.save(batch);
    }

    private void removeFifo(UUID productId, int quantity) {
        List<ProductBatch> batches = productBatchRepository.findActiveBatchesFefo(productId);
        int remaining = quantity;

        for (ProductBatch batch : batches) {
            if (remaining <= 0) break;
            int take = Math.min(remaining, batch.getQuantityRemaining());
            batch.setQuantityRemaining(batch.getQuantityRemaining() - take);
            productBatchRepository.save(batch);
            remaining -= take;
        }

        if (remaining > 0) {
            throw new InsufficientStockException(
                    "Not enough stock. Requested: " + quantity + ", available: " + (quantity - remaining));
        }
    }

    private void syncProductQuantity(UUID productId) {
        int total = productBatchRepository.sumAvailableQuantity(productId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        product.setQuantity(total);
        productRepository.save(product);
    }

    private String generateBatchNumber(UUID productId, boolean isPerishable) {
        String prefix = isPerishable ? "BATCH" : "ARR";
        String shortId = productId.toString().substring(0, 8);
        String dateStr = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return prefix + "-" + shortId + "-" + dateStr;
    }

    private String computeBatchStatus(ProductBatch batch, LocalDate today) {
        if (batch.getQuantityRemaining() <= 0) {
            return "DEPLETED";
        }
        if (batch.getExpiryDate() == null) {
            return "HEALTHY";
        }
        if (batch.getExpiryDate().isBefore(today)) {
            return "EXPIRED";
        }
        if (batch.getExpiryDate().minusMonths(6).isBefore(today)) {
            return "NEAR_EXPIRY";
        }
        return "HEALTHY";
    }
}
