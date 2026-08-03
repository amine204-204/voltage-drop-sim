package com.etap.voltagedrop.catalog.imports;

import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.CableCatalogRepository;
import com.etap.voltagedrop.catalog.mongo.SwitchCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.SwitchCatalogRepository;
import com.etap.voltagedrop.catalog.mongo.TransformerCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.TransformerCatalogRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CatalogImportService {

    private static final String STATUS_OK = "OK";
    private static final String STATUS_DUPLICATE = "DUPLICATE";
    private static final String STATUS_ERROR = "ERROR";

    private static final List<CatalogImportField> CABLE_FIELDS = List.of(
            new CatalogImportField("name", "Name", "Identification", "string", true),
            new CatalogImportField("standard", "Standard", "Identification", "string", true),
            new CatalogImportField("active", "Active", "Identification", "boolean", false),
            new CatalogImportField("physical.crossSection", "Cross Section", "Physical", "string", true),
            new CatalogImportField("physical.conductorMaterial", "Conductor Material", "Physical", "string", true),
            new CatalogImportField("physical.insulationMaterial", "Insulation Material", "Physical", "string", false),
            new CatalogImportField("physical.outerDiameterMm", "Outer Diameter (mm)", "Physical", "number", false),
            new CatalogImportField("electrical.resistancePerKm", "Resistance R (Ω/km)", "Electrical", "number", true),
            new CatalogImportField("electrical.reactancePerKm", "Reactance X (Ω/km)", "Electrical", "number", true),
            new CatalogImportField("electrical.ampacityFreeAirA", "Ampacity Free Air (A)", "Electrical", "number", true),
            new CatalogImportField("electrical.ampacityBuriedA", "Ampacity Buried (A)", "Electrical", "number", false),
            new CatalogImportField("electrical.voltageDropPerAKm", "Voltage Drop (V/A/km)", "Electrical", "number", false),
            new CatalogImportField("thermal.ratedTempC", "Rated Temp (°C)", "Thermal", "number", false),
            new CatalogImportField("thermal.maxShortCircuitTempC", "Max Short-Circuit Temp (°C)", "Thermal", "number", false));

    private static final List<CatalogImportField> TRANSFORMER_FIELDS = List.of(
            new CatalogImportField("name", "Name", "Identification", "string", true),
            new CatalogImportField("standard", "Standard", "Identification", "string", true),
            new CatalogImportField("active", "Active", "Identification", "boolean", false),
            new CatalogImportField("electrical.ratedPowerKva", "Rated Power (kVA)", "Electrical", "number", true),
            new CatalogImportField("electrical.primaryVoltageV", "Primary Voltage (V)", "Electrical", "number", true),
            new CatalogImportField("electrical.secondaryVoltageV", "Secondary Voltage (V)", "Electrical", "number", true),
            new CatalogImportField("electrical.impedancePercent", "Impedance Z (%)", "Electrical", "number", true),
            new CatalogImportField("electrical.noLoadLossW", "No-Load Loss (W)", "Electrical", "number", false),
            new CatalogImportField("electrical.loadLossW", "Load Loss (W)", "Electrical", "number", false),
            new CatalogImportField("tapChanger.steps", "Tap Steps", "Tap Changer", "number", false),
            new CatalogImportField("tapChanger.stepVoltagePercent", "Step Voltage (%)", "Tap Changer", "number", false));

    private static final List<CatalogImportField> SWITCH_FIELDS = List.of(
            new CatalogImportField("name", "Name", "Identification", "string", true),
            new CatalogImportField("standard", "Standard", "Identification", "string", true),
            new CatalogImportField("active", "Active", "Identification", "boolean", false),
            new CatalogImportField("electrical.ratedCurrentA", "Rated Current (A)", "Electrical", "number", true),
            new CatalogImportField("electrical.breakingCapacity", "Breaking Capacity", "Electrical", "string", true));

    private final CableCatalogRepository cableRepo;
    private final TransformerCatalogRepository transformerRepo;
    private final SwitchCatalogRepository switchRepo;
    private final ObjectMapper objectMapper;

    public List<CatalogImportField> fieldDefinitions(CatalogImportType type) {
        return switch (type) {
            case CABLE -> CABLE_FIELDS;
            case TRANSFORMER -> TRANSFORMER_FIELDS;
            case SWITCH -> SWITCH_FIELDS;
        };
    }

    public ImportHeadersResponse readHeaders(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (isJsonFile(fileName)) {
            return readJsonHeaders(file);
        }
        if (isExcelFile(fileName)) {
            ExcelData data = readExcel(file);
            List<Map<String, String>> samples = data.rows().size() <= 3
                    ? data.rows()
                    : data.rows().subList(0, 3);
            return new ImportHeadersResponse(fileName, "excel", data.headers(), samples);
        }
        throw new IllegalArgumentException("Unsupported file type. Use .json, .xlsx or .xls");
    }

    public CatalogImportPreview preview(CatalogImportType type, MultipartFile file, String mappingJson) throws IOException {
        String fileName = file.getOriginalFilename();

        if (isJsonFile(fileName)) {
            List<Object> docs = readJsonDocuments(file, type);
            List<ImportRowResult> rows = new ArrayList<>();
            for (int i = 0; i < docs.size(); i++) {
                rows.add(buildResult(type, docs.get(i), i + 2));
            }
            return buildPreview(type, fileName, rows);
        }

        if (isExcelFile(fileName)) {
            Map<String, String> mapping = parseMapping(mappingJson);
            ExcelData data = readExcel(file);
            List<ImportRowResult> rows = new ArrayList<>();
            for (int i = 0; i < data.rows().size(); i++) {
                rows.add(buildExcelRow(type, data.rows().get(i), data.headers(), mapping, i + 2));
            }
            return buildPreview(type, fileName, rows);
        }

        throw new IllegalArgumentException("Unsupported file type. Use .json, .xlsx or .xls");
    }

    public ImportCommitResult commit(ImportCommitRequest request) {
        CatalogImportType type = CatalogImportType.from(request.type());
        Set<String> existing = existingKeys(type);
        Set<String> seen = new HashSet<>();
        List<ImportDuplicate> duplicates = new ArrayList<>();
        int imported = 0;

        for (Map<String, Object> item : request.items()) {
            Object doc = toDocument(type, item);
            List<String> errors = validate(type, doc);
            if (!errors.isEmpty()) {
                duplicates.add(new ImportDuplicate(
                        extractName(doc), extractStandard(doc), String.join("; ", errors)));
                continue;
            }
            String key = keyOf(extractName(doc), extractStandard(doc));
            if (existing.contains(key) || !seen.add(key)) {
                duplicates.add(new ImportDuplicate(
                        extractName(doc), extractStandard(doc), "Already exists in the catalog."));
                continue;
            }
            save(type, doc);
            imported++;
        }

        return new ImportCommitResult(type.name(), imported, duplicates.size(), duplicates);
    }

    // ── Preview helpers ────────────────────────────────────────────────────

    private CatalogImportPreview buildPreview(CatalogImportType type, String fileName, List<ImportRowResult> rows) {
        Set<String> existing = existingKeys(type);
        Set<String> seen = new HashSet<>();
        List<ImportRowResult> result = new ArrayList<>();
        int valid = 0;
        int invalid = 0;
        int duplicate = 0;

        for (ImportRowResult row : rows) {
            if (STATUS_OK.equals(row.status())) {
                String key = keyOf(extractName(row.data()), extractStandard(row.data()));
                if (existing.contains(key) || !seen.add(key)) {
                    result.add(new ImportRowResult(row.rowNumber(), STATUS_DUPLICATE,
                            List.of("Already exists in the catalog."), row.data()));
                    duplicate++;
                    continue;
                }
                valid++;
                result.add(row);
            } else {
                invalid++;
                result.add(row);
            }
        }

        return new CatalogImportPreview(type.name(), fileName, rows.size(), valid, invalid, duplicate, result);
    }

    private ImportRowResult buildExcelRow(CatalogImportType type, Map<String, String> rawRow,
                                          List<String> headers, Map<String, String> mapping, int rowNumber) {
        List<String> errors = new ArrayList<>();
        Map<String, Object> map = buildDocumentMap(type, rawRow, mapping, errors);
        if (!errors.isEmpty()) {
            return new ImportRowResult(rowNumber, STATUS_ERROR, errors, map);
        }
        return buildResult(type, toDocument(type, map), rowNumber);
    }

    private ImportRowResult buildResult(CatalogImportType type, Object doc, int rowNumber) {
        List<String> errors = validate(type, doc);
        if (!errors.isEmpty()) {
            return new ImportRowResult(rowNumber, STATUS_ERROR, errors, toMap(doc));
        }
        return new ImportRowResult(rowNumber, STATUS_OK, List.of(), toMap(doc));
    }

    private Map<String, Object> buildDocumentMap(CatalogImportType type, Map<String, String> rawRow,
                                                 Map<String, String> mapping, List<String> errors) {
        Map<String, Object> doc = new LinkedHashMap<>();
        for (CatalogImportField field : fieldDefinitions(type)) {
            String column = mapping.get(field.key());
            if (column == null || column.isBlank()) {
                if (field.required()) {
                    errors.add("Required field '" + field.label() + "' has no mapped column.");
                }
                continue;
            }
            String raw = rawRow.get(column);
            if (raw == null || raw.isBlank()) {
                if (field.required()) {
                    errors.add("Field '" + field.label() + "' is empty (column '" + column + "').");
                }
                continue;
            }
            Object value;
            try {
                value = convertValue(field.type(), raw);
            } catch (NumberFormatException ex) {
                errors.add("Field '" + field.label() + "' has invalid value '" + raw + "'.");
                continue;
            }
            putAtPath(doc, field.key(), value);
        }
        return doc;
    }

    private Object convertValue(String type, String raw) {
        return switch (type) {
            case "number" -> parseNumber(raw);
            case "boolean" -> parseBoolean(raw);
            default -> raw.trim();
        };
    }

    private double parseNumber(String raw) {
        String value = raw.trim();
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ex) {
            String commaNormalized = value.replace(',', '.');
            return Double.parseDouble(commaNormalized);
        }
    }

    private boolean parseBoolean(String raw) {
        String value = raw.trim().toLowerCase();
        return switch (value) {
            case "true", "1", "yes", "y", "oui" -> true;
            case "false", "0", "no", "n", "non" -> false;
            default -> throw new NumberFormatException("Invalid boolean: " + raw);
        };
    }

    private void putAtPath(Map<String, Object> root, String path, Object value) {
        String[] parts = path.split("\\.");
        Map<String, Object> node = root;
        for (int i = 0; i < parts.length - 1; i++) {
            @SuppressWarnings("unchecked")
            Map<String, Object> child = (Map<String, Object>) node.computeIfAbsent(parts[i], k -> new LinkedHashMap<>());
            node = child;
        }
        node.put(parts[parts.length - 1], value);
    }

    // ── File parsing ───────────────────────────────────────────────────────

    private List<Object> readJsonDocuments(MultipartFile file, CatalogImportType type) throws IOException {
        JsonNode arr = objectMapper.readTree(file.getInputStream());
        if (!arr.isArray()) {
            throw new IllegalArgumentException("JSON file must contain an array of catalog items.");
        }
        List<Object> docs = new ArrayList<>();
        for (JsonNode node : arr) {
            docs.add(toDocument(type, node));
        }
        return docs;
    }

    private ImportHeadersResponse readJsonHeaders(MultipartFile file) throws IOException {
        JsonNode arr = objectMapper.readTree(file.getInputStream());
        if (!arr.isArray()) {
            throw new IllegalArgumentException("JSON file must contain an array of catalog items.");
        }
        List<String> keys = new ArrayList<>();
        if (!arr.isEmpty()) {
            arr.get(0).fieldNames().forEachRemaining(keys::add);
        }
        List<Map<String, String>> samples = new ArrayList<>();
        for (int i = 0; i < Math.min(arr.size(), 3); i++) {
            Map<String, String> sample = new LinkedHashMap<>();
            arr.get(i).fields().forEachRemaining(e -> sample.put(e.getKey(), e.getValue().asText()));
            samples.add(sample);
        }
        return new ImportHeadersResponse(file.getOriginalFilename(), "json", keys, samples);
    }

    private record ExcelData(List<String> headers, List<Map<String, String>> rows) {
    }

    private ExcelData readExcel(MultipartFile file) throws IOException {
        List<String> headers = new ArrayList<>();
        List<Map<String, String>> rows = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return new ExcelData(headers, rows);
            }
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                return new ExcelData(headers, rows);
            }
            DataFormatter formatter = new DataFormatter();
            int cellCount = headerRow.getLastCellNum();
            for (int c = 0; c < cellCount; c++) {
                Cell cell = headerRow.getCell(c);
                String header = formatter.formatCellValue(cell).trim();
                headers.add(header.isEmpty() ? "Column" + (c + 1) : header);
            }
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                Map<String, String> dataRow = new LinkedHashMap<>();
                boolean empty = true;
                for (int c = 0; c < headers.size(); c++) {
                    String value = formatter.formatCellValue(row.getCell(c)).trim();
                    dataRow.put(headers.get(c), value);
                    if (!value.isEmpty()) {
                        empty = false;
                    }
                }
                if (!empty) {
                    rows.add(dataRow);
                }
            }
        }
        return new ExcelData(headers, rows);
    }

    private Map<String, String> parseMapping(String mappingJson) {
        if (mappingJson == null || mappingJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(mappingJson, new TypeReference<Map<String, String>>() {
            });
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid column mapping JSON.");
        }
    }

    private boolean isJsonFile(String fileName) {
        return fileName != null && fileName.toLowerCase().endsWith(".json");
    }

    private boolean isExcelFile(String fileName) {
        if (fileName == null) {
            return false;
        }
        String lower = fileName.toLowerCase();
        return lower.endsWith(".xlsx") || lower.endsWith(".xls");
    }

    // ── Document conversion & validation ───────────────────────────────────

    private Object toDocument(CatalogImportType type, Object source) {
        Object doc = switch (type) {
            case CABLE -> objectMapper.convertValue(source, CableCatalogDocument.class);
            case TRANSFORMER -> objectMapper.convertValue(source, TransformerCatalogDocument.class);
            case SWITCH -> objectMapper.convertValue(source, SwitchCatalogDocument.class);
        };
        boolean activeProvided = source instanceof JsonNode node ? node.has("active")
                : source instanceof Map<?, ?> map && map.containsKey("active");
        stripIdentityAndApplyDefaults(doc, !activeProvided);
        return doc;
    }

    private void stripIdentityAndApplyDefaults(Object doc, boolean applyDefaultActive) {
        if (doc instanceof CableCatalogDocument d) {
            d.setId(null);
            d.setCategory(d.getCategory() == null || d.getCategory().isBlank() ? "cable" : d.getCategory());
            if (applyDefaultActive) {
                d.setActive(true);
            }
            if (d.getElectrical() == null) {
                d.setElectrical(new CableCatalogDocument.ElectricalProperties());
            }
            if (d.getPhysical() == null) {
                d.setPhysical(new CableCatalogDocument.PhysicalProperties());
            }
            if (d.getThermal() == null) {
                CableCatalogDocument.ThermalProperties thermal = new CableCatalogDocument.ThermalProperties();
                thermal.setRatedTempC(90);
                thermal.setMaxShortCircuitTempC(250);
                d.setThermal(thermal);
            }
        } else if (doc instanceof TransformerCatalogDocument t) {
            t.setId(null);
            t.setCategory(t.getCategory() == null || t.getCategory().isBlank() ? "transformer" : t.getCategory());
            if (applyDefaultActive) {
                t.setActive(true);
            }
            if (t.getElectrical() == null) {
                t.setElectrical(new TransformerCatalogDocument.ElectricalProperties());
            }
        } else if (doc instanceof SwitchCatalogDocument s) {
            s.setId(null);
            s.setCategory(s.getCategory() == null || s.getCategory().isBlank() ? "switch" : s.getCategory());
            if (applyDefaultActive) {
                s.setActive(true);
            }
            if (s.getElectrical() == null) {
                s.setElectrical(new SwitchCatalogDocument.ElectricalProperties());
            }
        }
    }

    private Map<String, Object> toMap(Object doc) {
        return objectMapper.convertValue(doc, new TypeReference<LinkedHashMap<String, Object>>() {
        });
    }

    private List<String> validate(CatalogImportType type, Object doc) {
        List<String> errors = new ArrayList<>();
        switch (type) {
            case CABLE -> validateCable((CableCatalogDocument) doc, errors);
            case TRANSFORMER -> validateTransformer((TransformerCatalogDocument) doc, errors);
            case SWITCH -> validateSwitch((SwitchCatalogDocument) doc, errors);
        }
        return errors;
    }

    private void validateCable(CableCatalogDocument d, List<String> errors) {
        requireText(d.getName(), "name", errors);
        requireText(d.getStandard(), "standard", errors);
        requireText(d.getPhysical() != null ? d.getPhysical().getCrossSection() : null, "physical.crossSection", errors);
        String material = d.getPhysical() != null ? d.getPhysical().getConductorMaterial() : null;
        if (material == null || material.isBlank()) {
            errors.add("physical.conductorMaterial is required.");
        } else if (!Set.of("CU", "AL").contains(material.trim().toUpperCase())) {
            errors.add("physical.conductorMaterial must be CU or AL.");
        }
        if (d.getElectrical() != null) {
            requirePositive(d.getElectrical().getResistancePerKm(), "electrical.resistancePerKm", errors);
            requireNonNegative(d.getElectrical().getReactancePerKm(), "electrical.reactancePerKm", errors);
            requirePositive(d.getElectrical().getAmpacityFreeAirA(), "electrical.ampacityFreeAirA", errors);
        }
    }

    private void validateTransformer(TransformerCatalogDocument d, List<String> errors) {
        requireText(d.getName(), "name", errors);
        requireText(d.getStandard(), "standard", errors);
        if (d.getElectrical() != null) {
            requirePositive(d.getElectrical().getRatedPowerKva(), "electrical.ratedPowerKva", errors);
            requirePositive(d.getElectrical().getPrimaryVoltageV(), "electrical.primaryVoltageV", errors);
            requirePositive(d.getElectrical().getSecondaryVoltageV(), "electrical.secondaryVoltageV", errors);
            requirePositive(d.getElectrical().getImpedancePercent(), "electrical.impedancePercent", errors);
        }
    }

    private void validateSwitch(SwitchCatalogDocument d, List<String> errors) {
        requireText(d.getName(), "name", errors);
        requireText(d.getStandard(), "standard", errors);
        if (d.getElectrical() != null) {
            requirePositive(d.getElectrical().getRatedCurrentA(), "electrical.ratedCurrentA", errors);
            requireText(d.getElectrical().getBreakingCapacity(), "electrical.breakingCapacity", errors);
        }
    }

    private void requireText(String value, String label, List<String> errors) {
        if (value == null || value.isBlank()) {
            errors.add(label + " is required.");
        }
    }

    private void requirePositive(double value, String label, List<String> errors) {
        if (value <= 0) {
            errors.add(label + " must be greater than 0.");
        }
    }

    private void requireNonNegative(double value, String label, List<String> errors) {
        if (value < 0) {
            errors.add(label + " must be zero or greater.");
        }
    }

    // ── Persistence ────────────────────────────────────────────────────────

    private Set<String> existingKeys(CatalogImportType type) {
        Set<String> keys = new HashSet<>();
        switch (type) {
            case CABLE -> cableRepo.findAll().forEach(d -> keys.add(keyOf(d.getName(), d.getStandard())));
            case TRANSFORMER -> transformerRepo.findAll().forEach(d -> keys.add(keyOf(d.getName(), d.getStandard())));
            case SWITCH -> switchRepo.findAll().forEach(d -> keys.add(keyOf(d.getName(), d.getStandard())));
        }
        return keys;
    }

    private void save(CatalogImportType type, Object doc) {
        switch (type) {
            case CABLE -> cableRepo.save((CableCatalogDocument) doc);
            case TRANSFORMER -> transformerRepo.save((TransformerCatalogDocument) doc);
            case SWITCH -> switchRepo.save((SwitchCatalogDocument) doc);
        }
    }

    private String keyOf(String name, String standard) {
        String n = name == null ? "" : name.trim().toLowerCase();
        String s = standard == null ? "" : standard.trim().toLowerCase();
        return n + "|" + s;
    }

    private String extractName(Object data) {
        if (data instanceof Map<?, ?> map) {
            Object name = map.get("name");
            return name == null ? null : String.valueOf(name);
        }
        if (data instanceof CableCatalogDocument d) {
            return d.getName();
        }
        if (data instanceof TransformerCatalogDocument t) {
            return t.getName();
        }
        if (data instanceof SwitchCatalogDocument s) {
            return s.getName();
        }
        return null;
    }

    private String extractStandard(Object data) {
        if (data instanceof Map<?, ?> map) {
            Object standard = map.get("standard");
            return standard == null ? null : String.valueOf(standard);
        }
        if (data instanceof CableCatalogDocument d) {
            return d.getStandard();
        }
        if (data instanceof TransformerCatalogDocument t) {
            return t.getStandard();
        }
        if (data instanceof SwitchCatalogDocument s) {
            return s.getStandard();
        }
        return null;
    }
}
