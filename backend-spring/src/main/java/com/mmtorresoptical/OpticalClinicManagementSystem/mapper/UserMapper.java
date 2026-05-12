package com.mmtorresoptical.OpticalClinicManagementSystem.mapper;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.user.UserAuditDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(
            target = "fullName",
            expression = "java(buildFullName(user.getFirstName(), user.getMiddleName(), user.getLastName()))"
    )
    UserSummaryDTO entityToDTO(User user);

    @Mapping(target = "securityAnswerHash", ignore = true)
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

    default String buildFullName(String first, String middle, String last) {
        StringBuilder name = new StringBuilder();

        if (first != null && !first.isBlank()) {
            name.append(first).append(" ");
        }

        if (middle != null && !middle.isBlank()) {
            name.append(middle).append(" ");
        }

        if (last != null && !last.isBlank()) {
            name.append(last);
        }

        return name.toString().trim();
    }
}
