package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.config.ApiPaths;
import com.etap.voltagedrop.dto.admin.UserSummaryDto;
import com.etap.voltagedrop.dto.auth.ChangePasswordRequest;
import com.etap.voltagedrop.dto.auth.UpdateProfileRequest;
import com.etap.voltagedrop.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(ApiPaths.PROFILE)
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getOwnProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username)
                .map(user -> ResponseEntity.ok((Object) UserSummaryDto.fromEntity(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<?> updateOwnProfile(@RequestBody UpdateProfileRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userService.findByUsername(username).orElseThrow();
        UserSummaryDto updated = userService.updateProfile(user.getId(), request.getUsername(), request.getEmail());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/password")
    public ResponseEntity<?> changeOwnPassword(@RequestBody ChangePasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userService.findByUsername(username).orElseThrow();
        userService.changePassword(user.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        return userService.listAllUsers().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .map(user -> ResponseEntity.ok((Object) user))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody UpdateProfileRequest request) {
        UserSummaryDto updated = userService.updateProfile(id, request.getUsername(), request.getEmail());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
