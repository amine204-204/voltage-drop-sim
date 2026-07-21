package com.etap.voltagedrop.catalog.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "transformers")
@Data
public class TransformerCatalogDocument {
    @Id
    private String id;
    private String name;
    private String standard;
    private String category;
    private boolean active;

    private ElectricalProperties electrical;

    @Data
    public static class ElectricalProperties {
        private double impedancePercent;
        private double ratedPowerKva;
        private double primaryVoltageV;
        private double secondaryVoltageV;
        private double noLoadLossW;
        private double loadLossW;
    }
}
