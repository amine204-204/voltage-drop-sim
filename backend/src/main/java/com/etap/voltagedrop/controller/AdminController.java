package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.dto.admin.CreateUserRequest;
import com.etap.voltagedrop.dto.admin.UpdateRoleRequest;
import com.etap.voltagedrop.dto.admin.UserSummaryDto;
import com.etap.voltagedrop.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final CatalogService catalogService;

    // ── User Management ─────────────────────────────────────────────

    @GetMapping("/users")
    public List<UserSummaryDto> listUsers() {
        return userService.listAllUsers();
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        if (userService.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        if (userService.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        try {
            UserSummaryDto user = userService.createUser(request);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody UpdateRoleRequest request) {
        return userService.updateRole(id, request.getRole())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    // ── Catalog CRUD ────────────────────────────────────────────────

    @GetMapping("/catalogs")
    public List<CableCatalogDocument> listAllCables() {
        return catalogService.listAllCablesAdmin();
    }

    @PostMapping("/catalogs")
    public CableCatalogDocument createCable(@RequestBody CableCatalogDocument cable) {
        return catalogService.createCable(cable);
    }

    @PutMapping("/catalogs/{id}")
    public ResponseEntity<?> updateCable(@PathVariable String id, @RequestBody CableCatalogDocument cable) {
        try {
            return ResponseEntity.ok(catalogService.updateCable(id, cable));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/catalogs/{id}")
    public ResponseEntity<?> deleteCable(@PathVariable String id) {
        return catalogService.deleteCable(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }
}
