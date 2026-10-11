package com.etap.voltagedrop.dto.auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    private String username;
    private String email;
}
