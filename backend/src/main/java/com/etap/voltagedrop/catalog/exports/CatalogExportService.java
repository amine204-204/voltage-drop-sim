package com.etap.voltagedrop.catalog.exports;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.catalog.imports.CatalogImportField;
import com.etap.voltagedrop.catalog.imports.CatalogImportService;
import com.etap.voltagedrop.catalog.imports.CatalogImportType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogExportService {

    private final CatalogService catalogService;
    private final CatalogImportService importService;
    private final ObjectMapper objectMapper;

    public byte[] exportJson(CatalogImportType type) throws IOException {
        return objectMapper.writeValueAsBytes(allDocuments(type));
    }

    public byte[] exportExcel(CatalogImportType type) throws IOException {
        List<CatalogImportField> fields = importService.fieldDefinitions(type);
        List<?> docs = allDocuments(type);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Catalog");
            Row header = sheet.createRow(0);
            for (int i = 0; i < fields.size(); i++) {
                header.createCell(i).setCellValue(fields.get(i).label());
            }
            int rowIndex = 1;
            for (Object doc : docs) {
                Row row = sheet.createRow(rowIndex++);
                for (int i = 0; i < fields.size(); i++) {
                    writeCell(row.createCell(i), readPath(doc, fields.get(i).key()));
                }
            }
            for (int i = 0; i < fields.size(); i++) {
                sheet.setColumnWidth(i, 24 * 256);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private List<?> allDocuments(CatalogImportType type) {
        return switch (type) {
            case CABLE -> catalogService.listAllCablesAdmin();
            case TRANSFORMER -> catalogService.listAllTransformersAdmin();
            case SWITCH -> catalogService.listAllSwitchesAdmin();
        };
    }

    private Object readPath(Object doc, String path) {
        @SuppressWarnings("unchecked")
        Map<String, Object> map = objectMapper.convertValue(doc, Map.class);
        String[] parts = path.split("\\.");
        Object node = map;
        for (String part : parts) {
            if (!(node instanceof Map<?, ?>)) {
                return null;
            }
            node = ((Map<?, ?>) node).get(part);
            if (node == null) {
                return null;
            }
        }
        return node;
    }

    private void writeCell(Cell cell, Object value) {
        if (value == null) {
            return;
        }
        if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else if (value instanceof Boolean bool) {
            cell.setCellValue(bool);
        } else {
            cell.setCellValue(String.valueOf(value));
        }
    }
}
