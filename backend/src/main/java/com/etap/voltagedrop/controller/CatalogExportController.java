package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.exports.CatalogExportService;
import com.etap.voltagedrop.catalog.imports.CatalogImportType;
import com.etap.voltagedrop.config.ApiPaths;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping(ApiPaths.ADMIN + "/catalogs/export")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CatalogExportController {

    private static final MediaType XLSX_MEDIA_TYPE =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final CatalogExportService exportService;

    @GetMapping
    public ResponseEntity<byte[]> export(
            @RequestParam CatalogImportType type,
            @RequestParam(defaultValue = "json") String format) throws IOException {
        boolean excel = "excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format);
        byte[] body = excel ? exportService.exportExcel(type) : exportService.exportJson(type);
        String filename = type.name().toLowerCase() + "-catalog." + (excel ? "xlsx" : "json");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(excel ? XLSX_MEDIA_TYPE : MediaType.APPLICATION_JSON)
                .body(body);
    }
}
