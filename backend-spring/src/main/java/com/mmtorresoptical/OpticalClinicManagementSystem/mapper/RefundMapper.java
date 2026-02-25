package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.refund.RefundAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Refund;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring",
uses = {UserMapper.class})
public interface RefundMapper {

    RefundDetailsDTO entityToDetailsDTO(Refund refund);

    @Mapping(
            target = "refundedByUserId",
            source = "user.userId"
    )
    RefundAuditDTO entityToAuditDTO(Refund refund);
}