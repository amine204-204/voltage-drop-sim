package com.etap.voltagedrop.catalog.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "load_presets")
@Data
public class LoadPresetDocument {
    @Id
    private String id;
    private String name;
    private String description;
    private String loadType;
    private double cosPhi;
    private String unit;
    private double durationSeconds = 86400;
    private List<ControlPoint> defaultProfile;
    private boolean active;

    @Data
    public static class ControlPoint {
        private double time;
        private double value;
    }
}