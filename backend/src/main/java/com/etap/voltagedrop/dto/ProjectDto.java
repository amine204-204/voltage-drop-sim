package com.etap.voltagedrop.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    private int totalTimeSteps;
    private double deltaTimeSeconds;
    private String selectedNormType;
    private Double customMinPu;
    private Double customMaxPu;

    private List<NodeDto> nodes;
    private List<BranchDto> branches;
    private SimulationResultDto simulationResult;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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
        private List<Map<String, Object>> loadProfileControlPoints;
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
        private String catalogId;
        private String componentCrossSection;
        private String componentMaterial;
    }

    @Getter
    @Setter
    public static class SimulationResultDto {
        private List<NodeResultDto> nodesResults;
        private List<BranchResultDto> branchesResults;
    }

    @Getter
    @Setter
    public static class NodeResultDto {
        private String nodeId;
        private List<Double> potentialTimeSeries;
    }

    @Getter
    @Setter
    public static class BranchResultDto {
        private String branchId;
        private List<Double> currentTimeSeries;
        private List<Double> dropPercentTimeSeries;
        private List<String> statusTimeSeries;
        private List<PowerQualityEventDto> powerQualityEvents;
    }

    @Getter
    @Setter
    public static class PowerQualityEventDto {
        private int startTimeStep;
        private int endTimeStep;
        private double worstMagnitudePu;
        private String classification;
    }
}
