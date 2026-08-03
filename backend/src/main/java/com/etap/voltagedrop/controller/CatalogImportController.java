package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.imports.CatalogImportField;
import com.etap.voltagedrop.catalog.imports.CatalogImportPreview;
import com.etap.voltagedrop.catalog.imports.CatalogImportService;
import com.etap.voltagedrop.catalog.imports.CatalogImportType;
import com.etap.voltagedrop.catalog.imports.ImportCommitRequest;
import com.etap.voltagedrop.catalog.imports.ImportCommitResult;
import com.etap.voltagedrop.catalog.imports.ImportHeadersResponse;
import com.etap.voltagedrop.config.ApiPaths;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping(ApiPaths.ADMIN + "/catalogs/import")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CatalogImportController {

    private final CatalogImportService importService;

    @GetMapping("/fields")
    public List<CatalogImportField> fields(@RequestParam CatalogImportType type) {
        return importService.fieldDefinitions(type);
    }

    @PostMapping("/headers")
    public ImportHeadersResponse headers(@RequestParam("file") MultipartFile file) throws IOException {
        return importService.readHeaders(file);
    }

    @PostMapping("/preview")
    public CatalogImportPreview preview(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") CatalogImportType type,
            @RequestParam(value = "mapping", required = false) String mapping) throws IOException {
        return importService.preview(type, file, mapping);
    }

    @PostMapping("/commit")
    public ImportCommitResult commit(@RequestBody ImportCommitRequest request) {
        return importService.commit(request);
    }
}
