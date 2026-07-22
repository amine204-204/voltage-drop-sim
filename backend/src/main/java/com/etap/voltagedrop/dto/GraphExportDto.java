package com.etap.voltagedrop.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class GraphExportDto {
    private List<NodeDto> nodes;
    private List<BranchDto> branches;

    @Getter
    @Setter
    public static class NodeDto {
        private String id;
        private String name;
        private String type;
        private Double nominalVoltage;
        private String loadType;
        private String selectedPresetId;
        private Double cosPhi;
        private List<Double> loadProfile;
        private List<java.util.Map<String, Object>> loadProfileControlPoints;
        private double x;
        private double y;
    }

    @Getter
    @Setter
    public static class BranchDto {
        private String id;
        private String name;
        private String fromNodeId;
        private String toNodeId;
        private double lengthInKm;
        private String branchType;
        private String catalogId;
        private Boolean closed;
    }
}
