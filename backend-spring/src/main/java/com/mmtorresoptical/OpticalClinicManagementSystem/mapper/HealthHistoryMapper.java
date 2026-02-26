package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.healthhistory.HealthHistoryAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.CreateHealthHistoryRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.HealthHistoryResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.healthhistory.UpdateHealthHistoryRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.HealthHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = UserMapper.class
)
public interface HealthHistoryMapper {

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    @Mapping(
            target = "createdAt",
            source = "createdAt"
    )
    HealthHistoryResponseDTO historyToResponseDTO(HealthHistory healthHistory);

    HealthHistory createHistoryDTOToEntity(CreateHealthHistoryRequestDTO createHealthHistoryRequestDTO);

    @Mapping(
            target = "createdBy",
            source = "user"
    )
    @Mapping(
            target = "createdAt",
            source = "createdAt"
    )
    HealthHistoryDetailsDTO historyToDetailsDTO(HealthHistory healthHistory);

    void updateHistoryFromDTO(UpdateHealthHistoryRequestDTO updateHealthHistoryRequestDTO, @MappingTarget HealthHistory healthHistory);

    HealthHistoryAuditDTO entityToAuditDTO(HealthHistory healthHistory);

    List<HealthHistoryAuditDTO> entityListToAuditDTOList(List<HealthHistory> healthHistory);
}