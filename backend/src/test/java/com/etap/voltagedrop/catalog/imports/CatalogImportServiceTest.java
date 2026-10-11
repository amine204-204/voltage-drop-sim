package com.etap.voltagedrop.catalog.imports;

import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.CableCatalogRepository;
import com.etap.voltagedrop.catalog.mongo.SwitchCatalogRepository;
import com.etap.voltagedrop.catalog.mongo.TransformerCatalogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CatalogImportServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CableCatalogRepository cableRepo = mock(CableCatalogRepository.class);
    private final TransformerCatalogRepository transformerRepo = mock(TransformerCatalogRepository.class);
    private final SwitchCatalogRepository switchRepo = mock(SwitchCatalogRepository.class);

    private final CatalogImportService service =
            new CatalogImportService(cableRepo, transformerRepo, switchRepo, objectMapper);

    private static final Map<String, String> CABLE_MAPPING = Map.of(
            "name", "Name",
            "standard", "Standard",
            "physical.crossSection", "Section",
            "physical.conductorMaterial", "Material",
            "electrical.resistancePerKm", "R",
            "electrical.reactancePerKm", "X",
            "electrical.ampacityFreeAirA", "Air");

    @Test
    void excelMappingProducesValidRow() throws Exception {
        CatalogImportPreview preview =
                service.preview(CatalogImportType.CABLE, cableExcelFile(), toJson(CABLE_MAPPING));

        assertThat(preview.totalRows()).isEqualTo(1);
        assertThat(preview.validCount()).isEqualTo(1);
        assertThat(preview.invalidCount()).isZero();
        assertThat(preview.rows().get(0).status()).isEqualTo("OK");
        assertThat(preview.rows().get(0).data())
                .extracting("name", "standard")
                .containsExactly("NYY 3x16 CU", "IEC 60502");
    }

    @Test
    void missingRequiredMappingMarksRowAsError() throws Exception {
        Map<String, String> partial = Map.of("name", "Name", "standard", "Standard");

        CatalogImportPreview preview =
                service.preview(CatalogImportType.CABLE, cableExcelFile(), toJson(partial));

        assertThat(preview.validCount()).isZero();
        assertThat(preview.invalidCount()).isEqualTo(1);
        assertThat(preview.rows().get(0).status()).isEqualTo("ERROR");
        assertThat(preview.rows().get(0).errors()).isNotEmpty();
    }

    @Test
    void invalidJsonRowIsReported() throws Exception {
        byte[] body = "[{\"name\":\"A\",\"standard\":\"X\"}]".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile jsonFile =
                new MockMultipartFile("file", "cables.json", "application/json", body);

        CatalogImportPreview preview =
                service.preview(CatalogImportType.CABLE, jsonFile, null);

        assertThat(preview.totalRows()).isEqualTo(1);
        assertThat(preview.invalidCount()).isEqualTo(1);
        assertThat(preview.rows().get(0).errors()).contains("electrical.resistancePerKm must be greater than 0.");
    }

    @Test
    void activeDefaultsToTrueWhenOmitted() throws Exception {
        String body = "[{\"name\":\"A\",\"standard\":\"X\","
                + "\"physical\":{\"crossSection\":\"16mm2\",\"conductorMaterial\":\"CU\"},"
                + "\"electrical\":{\"resistancePerKm\":1.1,\"reactancePerKm\":0.08,\"ampacityFreeAirA\":90}}]";
        MockMultipartFile jsonFile =
                new MockMultipartFile("file", "cables.json", "application/json", body.getBytes(StandardCharsets.UTF_8));

        CatalogImportPreview preview =
                service.preview(CatalogImportType.CABLE, jsonFile, null);

        assertThat(preview.validCount()).isEqualTo(1);
        assertThat(preview.rows().get(0).data()).extracting("active").isEqualTo(true);
    }

    @Test
    void commitSkipsDuplicatesAndSavesNewItems() {
        CableCatalogDocument existing = new CableCatalogDocument();
        existing.setName("Existing");
        existing.setStandard("STD");
        when(cableRepo.findAll()).thenReturn(List.of(existing));

        Map<String, Object> duplicate = validCableMap("Existing", "STD");
        Map<String, Object> fresh = validCableMap("New Cable", "STD");

        ImportCommitResult result = service.commit(
                new ImportCommitRequest("CABLE", List.of(duplicate, fresh)));

        assertThat(result.imported()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(1);
        assertThat(result.duplicates()).hasSize(1);
        assertThat(result.duplicates().get(0).name()).isEqualTo("Existing");

        verify(cableRepo, times(1)).save(any(CableCatalogDocument.class));
    }

    @Test
    void previewMarksIntraFileDuplicates() throws Exception {
        String item = validCableJson("Same Cable", "STD");
        byte[] body = ("[" + item + "," + item + "]").getBytes(StandardCharsets.UTF_8);
        MockMultipartFile jsonFile =
                new MockMultipartFile("file", "cables.json", "application/json", body);

        CatalogImportPreview preview = service.preview(CatalogImportType.CABLE, jsonFile, null);

        assertThat(preview.validCount()).isEqualTo(1);
        assertThat(preview.duplicateCount()).isEqualTo(1);
        assertThat(preview.rows().get(0).status()).isEqualTo("OK");
        assertThat(preview.rows().get(1).status()).isEqualTo("DUPLICATE");
    }

    @Test
    void jsonWithImpedanceTableParses() throws Exception {
        String body = "[{\"name\":\"With Table\",\"standard\":\"STD\","
                + "\"physical\":{\"crossSection\":\"16\",\"conductorMaterial\":\"CU\"},"
                + "\"electrical\":{\"resistancePerKm\":1.15,\"reactancePerKm\":0.08,\"ampacityFreeAirA\":85},"
                + "\"impedanceTable\":[{\"tempC\":20,\"rOhmKm\":1.15,\"xOhmKm\":0.08}]}]";
        MockMultipartFile jsonFile =
                new MockMultipartFile("file", "cables.json", "application/json", body.getBytes(StandardCharsets.UTF_8));

        CatalogImportPreview preview = service.preview(CatalogImportType.CABLE, jsonFile, null);

        assertThat(preview.validCount()).isEqualTo(1);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) preview.rows().get(0).data();
        assertThat(data).containsKey("impedanceTable");
    }

    @Test
    void headersAreExtractedFromExcel() throws Exception {
        ImportHeadersResponse response = service.readHeaders(cableExcelFile());

        assertThat(response.fileType()).isEqualTo("excel");
        assertThat(response.headers()).contains("Name", "R", "Air");
    }

    private MockMultipartFile cableExcelFile() throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Catalog");
            String[] headers = {"Name", "Standard", "Section", "Material", "R", "X", "Air"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }
            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("NYY 3x16 CU");
            row.createCell(1).setCellValue("IEC 60502");
            row.createCell(2).setCellValue("16mm2");
            row.createCell(3).setCellValue("CU");
            row.createCell(4).setCellValue(1.15);
            row.createCell(5).setCellValue(0.09);
            row.createCell(6).setCellValue(104.0);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return new MockMultipartFile("file", "cables.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    out.toByteArray());
        }
    }

    private Map<String, Object> validCableMap(String name, String standard) {
        return Map.of(
                "name", name,
                "standard", standard,
                "physical", Map.of("crossSection", "16mm2", "conductorMaterial", "CU"),
                "electrical", Map.of(
                        "resistancePerKm", 1.15,
                        "reactancePerKm", 0.09,
                        "ampacityFreeAirA", 104.0));
    }

    private String validCableJson(String name, String standard) {
        return "{\"name\":\"" + name + "\",\"standard\":\"" + standard + "\","
                + "\"physical\":{\"crossSection\":\"16\",\"conductorMaterial\":\"CU\"},"
                + "\"electrical\":{\"resistancePerKm\":1.15,\"reactancePerKm\":0.08,\"ampacityFreeAirA\":85}}";
    }

    private String toJson(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
