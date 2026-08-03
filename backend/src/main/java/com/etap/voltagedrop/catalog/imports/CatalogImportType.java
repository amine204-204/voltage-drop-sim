package com.etap.voltagedrop.catalog.imports;

public enum CatalogImportType {
    CABLE,
    TRANSFORMER,
    SWITCH;

    public static CatalogImportType from(String raw) {
        for (CatalogImportType type : values()) {
            if (type.name().equalsIgnoreCase(raw)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown import type: " + raw);
    }
}
