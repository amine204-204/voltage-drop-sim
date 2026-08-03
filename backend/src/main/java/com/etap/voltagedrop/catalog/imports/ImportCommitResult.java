package com.etap.voltagedrop.catalog.imports;

import java.util.List;

public record ImportCommitResult(
        String type,
        int imported,
        int skipped,
        List<ImportDuplicate> duplicates) {
}
