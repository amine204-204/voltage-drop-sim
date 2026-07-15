// com.etap.voltagedrop.catalog.mongo
package com.etap.voltagedrop.catalog.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "cables")
@Data
public class CableCatalogDocument {
    @Id
    private String id;
    private String name;
    private String standard;
    private String category;

    private ElectricalProperties electrical;
    private PhysicalProperties physical;
    private ThermalProperties thermal;
    private List<ImpedanceEntry> impedanceTable;
    private boolean active;

    @Data
    public static class ElectricalProperties {
        private double resistancePerKm;
        private double reactancePerKm;
        private double ampacityFreeAirA;
        private double ampacityBuriedA;
        private double voltageDropPerAKm;
    }

    @Data
    public static class PhysicalProperties {
        private String crossSection;
        private String conductorMaterial;
        private String insulationMaterial;
        private double outerDiameterMm;
    }

    @Data
    public static class ThermalProperties {
        private double ratedTempC;
        private double maxShortCircuitTempC;
    }

    @Data
    public static class ImpedanceEntry {
        private double tempC;
        private double rOhmKm;
        private double xOhmKm;
    }
}