package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.dto.auth.AuthResponse;
import com.etap.voltagedrop.dto.auth.LoginRequest;
import com.etap.voltagedrop.exception.ConflictException;
import com.etap.voltagedrop.persistence.entity.UserEntity;
import com.etap.voltagedrop.service.JwtService;
import com.etap.voltagedrop.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;

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

        return ResponseEntity.ok(new AuthResponse(token, user.getUsername(), user.getRole().name()));
    }

    @PostMapping("/seed-admin")
    public ResponseEntity<?> seedAdmin() {
        if (userService.existsByRole(UserEntity.Role.ADMIN)) {
            throw new ConflictException("Admin already exists");
        }

        var admin = userService.createUser("admin", "admin@voltagedrop.local", "admin123", UserEntity.Role.ADMIN);
        UserDetails userDetails = userDetailsService.loadUserByUsername(admin.getUsername());
        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, admin.getUsername(), admin.getRole()));
    }
}
