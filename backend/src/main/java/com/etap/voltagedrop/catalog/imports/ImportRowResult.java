package com.etap.voltagedrop.catalog.imports;

import java.util.List;

public record ImportRowResult(
        int rowNumber,
        String status,
        List<String> errors,
        Object data) {
}
