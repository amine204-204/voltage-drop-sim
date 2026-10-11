package com.etap.voltagedrop.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SimulationRequestDto {
    private int totalTimeSteps;
    private double deltaTimeSeconds;

    private String selectedNormType;

    //populated if costum selected
    private Double customMinPu;
    private Double customMaxPu;

    private GraphDto graph;

    @Getter
    @Setter
    public static class GraphDto {
        private java.util.List<NodeDto> nodes;
        private java.util.List<BranchDto> branches;
    }

    @Getter
    @Setter
    public static class NodeDto {
        private String id;
        private String name;
        private String type; // SOURCE, CONSUMER, JUNCTION

        private Double nominalVoltage; // if source

        //if consumer
        private String loadType; // CONSTANT_CURRENT, CONSTANT_POWER
        private java.util.List<Double> loadProfile;
        private Double cosPhi;
    }

    @Getter
    @Setter
    public static class BranchDto {
        private String id;
        private String name;
        private String fromNodeId;
        private String toNodeId;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private Double lengthInKm;
        private String branchType;
        private String catalogId;
        private String componentCrossSection;
        private String componentMaterial;
        private boolean closed;
    }
}