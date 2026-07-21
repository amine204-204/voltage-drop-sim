package com.etap.voltagedrop.catalog.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "switches")
@Data
public class SwitchCatalogDocument {
    @Id
    private String id;
    private String name;
    private String standard;
    private String category;
    private boolean active;

    private ElectricalProperties electrical;

    @Data
    public static class ElectricalProperties {
        private double ratedCurrentA;
        private String breakingCapacity;
    }
}
