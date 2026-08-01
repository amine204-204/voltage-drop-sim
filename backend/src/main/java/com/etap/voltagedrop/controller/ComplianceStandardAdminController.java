package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.config.ApiPaths;
import com.etap.voltagedrop.dto.admin.ComplianceStandardDto;
import com.etap.voltagedrop.service.ComplianceStandardService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(ApiPaths.ADMIN_COMPLIANCE_STANDARDS)
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ComplianceStandardAdminController {

    private final ComplianceStandardService service;

    @GetMapping
    public List<ComplianceStandardDto> listAll() {
        return service.listAll();
    }

    @PostMapping
    public ResponseEntity<ComplianceStandardDto> create(@Valid @RequestBody CreateRequest request) {
        ComplianceStandardDto dto = service.create(
                request.getName(),
                request.getDescription() != null ? request.getDescription() : "",
                request.getMinVoltagePu(),
                request.getMaxVoltagePu(),
                request.isActive(),
                request.isDefaultStandard()
        );
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComplianceStandardDto> update(@PathVariable Long id, @Valid @RequestBody CreateRequest request) {
        ComplianceStandardDto dto = service.update(
                id,
                request.getName(),
                request.getDescription() != null ? request.getDescription() : "",
                request.getMinVoltagePu(),
                request.getMaxVoltagePu(),
                request.isActive(),
                request.isDefaultStandard()
        );
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Compliance standard deleted."));
    }

    @Getter
    @Setter
    public static class CreateRequest {
        @NotBlank
        private String name;

        private String description;

        @NotNull
        private Double minVoltagePu;

        @NotNull
        private Double maxVoltagePu;

        private boolean active = true;
        private boolean defaultStandard = false;
    }
}
