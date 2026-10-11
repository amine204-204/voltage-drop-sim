package com.etap.voltagedrop.dto.admin;

import com.etap.voltagedrop.persistence.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String username;
    private String email;
    private String role;

    public static UserSummaryDto fromEntity(UserEntity user) {
        return new UserSummaryDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole().name()
        );
    }
}
