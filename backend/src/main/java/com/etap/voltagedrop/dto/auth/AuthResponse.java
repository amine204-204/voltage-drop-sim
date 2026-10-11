package com.etap.voltagedrop.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String username;
    private String role;
}
