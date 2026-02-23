package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Refund;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring",
uses = {UserMapper.class})
public interface RefundMapper {

    RefundDetailsDTO entityToDetailsDTO(Refund refund);

}