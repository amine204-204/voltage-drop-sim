package com.etap.voltagedrop.catalog.exports;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.catalog.imports.CatalogImportService;
import com.etap.voltagedrop.catalog.imports.CatalogImportType;
import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CatalogExportServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CatalogService catalogService = mock(CatalogService.class);
    private final CatalogImportService importService = mock(CatalogImportService.class);
    private final CatalogExportService service =
            new CatalogExportService(catalogService, importService, objectMapper);

    private static CableCatalogDocument cable(String name, String standard) {
        CableCatalogDocument doc = new CableCatalogDocument();
        doc.setName(name);
        doc.setStandard(standard);
        doc.setCategory("cable");
        doc.setActive(true);
        CableCatalogDocument.PhysicalProperties physical = new CableCatalogDocument.PhysicalProperties();
        physical.setCrossSection("16");
        physical.setConductorMaterial("CU");
        doc.setPhysical(physical);
        CableCatalogDocument.ElectricalProperties electrical = new CableCatalogDocument.ElectricalProperties();
        electrical.setResistancePerKm(1.15);
        electrical.setReactancePerKm(0.08);
        electrical.setAmpacityFreeAirA(85);
        doc.setElectrical(electrical);
        return doc;
    }

    @Test
    void jsonExportReturnsArray() throws Exception {
        when(catalogService.listAllCablesAdmin()).thenReturn(List.of(cable("A", "STD")));
        when(importService.fieldDefinitions(CatalogImportType.CABLE))
                .thenReturn(List.of(new com.etap.voltagedrop.catalog.imports.CatalogImportField(
                        "name", "Name", "Identification", "string", true)));

        byte[] bytes = service.exportJson(CatalogImportType.CABLE);
        JsonNode arr = objectMapper.readTree(bytes);

        assertThat(arr.isArray()).isTrue();
        assertThat(arr).hasSize(1);
        assertThat(arr.get(0).get("name").asText()).isEqualTo("A");
    }

    @Test
    void excelExportContainsHeaderAndRows() throws Exception {
        when(catalogService.listAllCablesAdmin()).thenReturn(List.of(cable("A", "STD")));
        when(importService.fieldDefinitions(CatalogImportType.CABLE))
                .thenReturn(List.of(
                        new com.etap.voltagedrop.catalog.imports.CatalogImportField(
                                "name", "Name", "Identification", "string", true),
                        new com.etap.voltagedrop.catalog.imports.CatalogImportField(
                                "electrical.resistancePerKm", "Resistance R (Ω/km)", "Electrical", "number", true)));

        byte[] bytes = service.exportExcel(CatalogImportType.CABLE);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            assertThat(sheet.getLastRowNum()).isEqualTo(1);
            Row header = sheet.getRow(0);
            assertThat(header.getCell(0).getStringCellValue()).isEqualTo("Name");
            assertThat(header.getCell(1).getStringCellValue()).isEqualTo("Resistance R (Ω/km)");
            Row row = sheet.getRow(1);
            assertThat(row.getCell(0).getStringCellValue()).isEqualTo("A");
            assertThat(row.getCell(1).getNumericCellValue()).isEqualTo(1.15);
        }
    }
}
