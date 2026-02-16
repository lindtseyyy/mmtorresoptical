package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
        componentModel = "spring",
        uses = UserMapper.class
)
public interface HealthHistoryMapper {

    @Mapping(
            target = "createdBy",
            source = "user" // how to convert this to DTO?
    )
    @Mapping(
            target = "createdAt",
            source = "createdAt"
    )
    HealthHistoryResponseDTO historyToResponseDTO(HealthHistory healthHistory);

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    @Mapping(
            target = "createdAt",
            source = "createdAt"
    )
    HealthHistoryDetailsDTO historyToDetailsDTO(HealthHistory healthHistory);

}