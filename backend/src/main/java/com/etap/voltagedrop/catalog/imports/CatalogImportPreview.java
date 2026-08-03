package com.etap.voltagedrop.catalog.imports;

import java.util.List;

public record CatalogImportPreview(
        String type,
        String fileName,
        int totalRows,
        int validCount,
        int invalidCount,
        int duplicateCount,
        List<ImportRowResult> rows) {
}
