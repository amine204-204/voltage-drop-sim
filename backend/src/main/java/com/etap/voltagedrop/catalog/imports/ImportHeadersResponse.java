package com.etap.voltagedrop.catalog.imports;

import java.util.List;
import java.util.Map;

public record ImportHeadersResponse(
        String fileName,
        String fileType,
        List<String> headers,
        List<Map<String, String>> sampleRows) {
}
