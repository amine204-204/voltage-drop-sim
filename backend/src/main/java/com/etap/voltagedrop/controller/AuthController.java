package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.dto.auth.AuthResponse;
import com.etap.voltagedrop.dto.auth.LoginRequest;
import com.etap.voltagedrop.dto.auth.RefreshTokenRequest;
import com.etap.voltagedrop.exception.ConflictException;
import com.etap.voltagedrop.persistence.entity.UserEntity;
import com.etap.voltagedrop.service.JwtService;
import com.etap.voltagedrop.service.RefreshTokenService;
import com.etap.voltagedrop.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw e;
        }

        UserEntity user = userService.findByUsername(request.getUsername()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = refreshTokenService.generateRefreshToken(userDetails, user);

        return ResponseEntity.ok(new AuthResponse(token, refreshToken, user.getUsername(), user.getRole().name()));
    }

    @PostMapping("/seed-admin")
    public ResponseEntity<?> seedAdmin() {
        if (userService.existsByRole(UserEntity.Role.ADMIN)) {
            throw new ConflictException("Admin already exists");
        }

        var admin = userService.createUser("admin", "admin@voltagedrop.local", "admin123", UserEntity.Role.ADMIN);
        UserEntity user = userService.findByUsername(admin.getUsername()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(admin.getUsername());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = refreshTokenService.generateRefreshToken(userDetails, user);

        return ResponseEntity.ok(new AuthResponse(token, refreshToken, admin.getUsername(), admin.getRole()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshTokenRequest request) {
        if (!refreshTokenService.validateRefreshToken(request.getRefreshToken())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired refresh token"));
        }

        var refreshTokenEntity = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.revokeToken(request.getRefreshToken());

        UserEntity user = refreshTokenEntity.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String newToken = jwtService.generateToken(userDetails);
        String newRefreshToken = refreshTokenService.generateRefreshToken(userDetails, user);

        return ResponseEntity.ok(new AuthResponse(newToken, newRefreshToken, user.getUsername(), user.getRole().name()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshTokenRequest request) {
        refreshTokenService.revokeToken(request.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
