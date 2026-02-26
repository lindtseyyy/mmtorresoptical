package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.user.UserAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserSummaryDTO entityToDTO(User user);

    User requestDTOtoEntity(CreateUserRequestDTO requestDTO);

    @Mapping(
            target = "gender",
            expression = "java(user.getGender().name())"
    )
    @Mapping(
            target = "role",
            expression = "java(user.getRole().name())"
    )
    UserResponseDTO entityToResponseDTO(User user);

    @Mapping(
            target = "gender",
            expression = "java(user.getGender().name())"
    )
    @Mapping(
            target = "role",
            expression = "java(user.getRole().name())"
    )
    UserDetailsDTO entityToDetailsDTO(User user);

    @Mapping(
            target = "gender",
            expression = "java(user.getGender().name())"
    )
    @Mapping(
            target = "role",
            expression = "java(user.getRole().name())"
    )
    UserAuditDTO entityToAuditDTO(User user);

    void updateEntityFromRequestDTO(UpdateUserRequestDTO userRequestDTO, @MappingTarget User user);
}
