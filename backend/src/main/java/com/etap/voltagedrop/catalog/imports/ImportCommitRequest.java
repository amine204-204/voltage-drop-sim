package com.etap.voltagedrop.catalog.imports;

import java.util.List;
import java.util.Map;

public record ImportCommitRequest(
        String type,
        List<Map<String, Object>> items) {
}
