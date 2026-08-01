package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.SwitchCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.TransformerCatalogDocument;
import com.etap.voltagedrop.config.ApiPaths;
import com.etap.voltagedrop.dto.admin.CreateUserRequest;
import com.etap.voltagedrop.dto.admin.UpdateRoleRequest;
import com.etap.voltagedrop.dto.admin.UserSummaryDto;
import com.etap.voltagedrop.exception.ConflictException;
import com.etap.voltagedrop.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiPaths.ADMIN)
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final CatalogService catalogService;

    @GetMapping("/users")
    public List<UserSummaryDto> listUsers() {
        return userService.listAllUsers();
    }

    @PostMapping("/users")
    public ResponseEntity<UserSummaryDto> createUser(@RequestBody CreateUserRequest request) {
        if (userService.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already exists");
        }
        if (userService.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already exists");
        }

        UserSummaryDto user = userService.createUser(request);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserSummaryDto> updateUserRole(@PathVariable Long id, @RequestBody UpdateRoleRequest request) {
        return userService.updateRole(id, request.getRole())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.findByUsername(currentUsername).ifPresent(user -> {
            if (user.getId().equals(id)) {
                throw new ConflictException("Cannot delete your own account");
            }
        });

        return userService.deleteUser(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/catalogs")
    public List<CableCatalogDocument> listAllCables() {
        return catalogService.listAllCablesAdmin();
    }

    @PostMapping("/catalogs")
    public CableCatalogDocument createCable(@RequestBody CableCatalogDocument cable) {
        return catalogService.createCable(cable);
    }

    @PutMapping("/catalogs/{id}")
    public CableCatalogDocument updateCable(@PathVariable String id, @RequestBody CableCatalogDocument cable) {
        return catalogService.updateCable(id, cable);
    }

    @DeleteMapping("/catalogs/{id}")
    public ResponseEntity<Void> deleteCable(@PathVariable String id) {
        return catalogService.deleteCable(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/catalogs/transformers")
    public List<TransformerCatalogDocument> listAllTransformers() {
        return catalogService.listAllTransformersAdmin();
    }

    @PostMapping("/catalogs/transformers")
    public TransformerCatalogDocument createTransformer(@RequestBody TransformerCatalogDocument transformer) {
        return catalogService.createTransformer(transformer);
    }

    @PutMapping("/catalogs/transformers/{id}")
    public TransformerCatalogDocument updateTransformer(@PathVariable String id, @RequestBody TransformerCatalogDocument transformer) {
        return catalogService.updateTransformer(id, transformer);
    }

    @DeleteMapping("/catalogs/transformers/{id}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable String id) {
        return catalogService.deleteTransformer(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/catalogs/switches")
    public List<SwitchCatalogDocument> listAllSwitches() {
        return catalogService.listAllSwitchesAdmin();
    }

    @PostMapping("/catalogs/switches")
    public SwitchCatalogDocument createSwitch(@RequestBody SwitchCatalogDocument sw) {
        return catalogService.createSwitch(sw);
    }

    @PutMapping("/catalogs/switches/{id}")
    public SwitchCatalogDocument updateSwitch(@PathVariable String id, @RequestBody SwitchCatalogDocument sw) {
        return catalogService.updateSwitch(id, sw);
    }

    @DeleteMapping("/catalogs/switches/{id}")
    public ResponseEntity<Void> deleteSwitch(@PathVariable String id) {
        return catalogService.deleteSwitch(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }
}
