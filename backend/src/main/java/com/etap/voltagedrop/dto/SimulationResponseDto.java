package com.etap.voltagedrop.dto;

import com.etap.voltagedrop.domain.quality.DisturbanceType;
import com.etap.voltagedrop.domain.quality.SimulationStatus;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SimulationResponseDto {

    private List<NodeResultDto> nodes;
    private List<BranchResultDto> branches;

    @Getter
    @Setter
    public static class NodeResultDto {
        private String id;
        private String name;
        private String type;
        private double localNominalVoltage;
        private List<Double> potentialTimeSeries;
        private List<Double> cumulativeDropPercentTimeSeries;
        private List<SimulationStatus> statusTimeSeries;
        private List<PowerQualityEventDto> powerQualityEvents;
        private List<PathBranchDto> pathBranches;
    }

    @Getter
    @Setter
    public static class BranchResultDto {
        private String id;
        private List<Double> currentTimeSeries;
        private List<Double> dropPercentTimeSeries;
    }

    @Getter
    @Setter
    public static class PathBranchDto {
        private String branchId;
        private String branchName;
    }

    @Getter
    @Setter
    public static class PowerQualityEventDto {
        private int startTimeStep;
        private int endTimeStep;
        private double worstMagnitudePu;
        private DisturbanceType classification;
    }
}
