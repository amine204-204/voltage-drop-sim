package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.dto.admin.ComplianceStandardDto;
import com.etap.voltagedrop.service.ComplianceStandardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/norms")
@RequiredArgsConstructor
public class NormController {

    private final ComplianceStandardService service;

    @GetMapping("/compliance-standards")
    public List<ComplianceStandardDto> listActive() {
        return service.listActive();
    }
}
