package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.dto.auth.AuthResponse;
import com.etap.voltagedrop.dto.auth.LoginRequest;
import com.etap.voltagedrop.dto.auth.RegisterRequest;
import com.etap.voltagedrop.persistence.entity.UserEntity;
import com.etap.voltagedrop.service.JwtService;
import com.etap.voltagedrop.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserEntity user = userService.findByUsername(request.getUsername()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, user.getUsername(), user.getRole().name()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userService.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        if (userService.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(UserEntity.Role.ENGINEER);

        var saved = userService.createUser(request.getUsername(), request.getEmail(), request.getPassword(), UserEntity.Role.ENGINEER);
        UserDetails userDetails = userDetailsService.loadUserByUsername(saved.getUsername());
        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, saved.getUsername(), saved.getRole()));
    }

    @PostMapping("/seed-admin")
    public ResponseEntity<?> seedAdmin() {
        if (userService.existsByRole(UserEntity.Role.ADMIN)) {
            return ResponseEntity.status(409).body(Map.of("error", "Admin already exists"));
        }

        var admin = userService.createUser("admin", "admin@voltagedrop.local", "admin123", UserEntity.Role.ADMIN);
        UserDetails userDetails = userDetailsService.loadUserByUsername(admin.getUsername());
        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, admin.getUsername(), admin.getRole()));
    }
}
