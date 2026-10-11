package com.etap.voltagedrop.domain;

import com.etap.voltagedrop.domain.quality.PowerQualityEvent;
import com.etap.voltagedrop.domain.quality.SimulationStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class NetworkNode {
    private String id;
    private String name;

    private List<Double> potentialTimeSeries = new ArrayList<>();
    private List<Double> cumulativeDropPercentTimeSeries = new ArrayList<>();
    private List<SimulationStatus> statusTimeSeries = new ArrayList<>();
    private List<PowerQualityEvent> powerQualityEvents = new ArrayList<>();
    private List<PathBranchInfo> pathBranches = new ArrayList<>();

    private double workingVoltage;
    private double localNominalVoltage;

    @JsonIgnore
    private PowerSource sourceBehavior;
    @JsonIgnore
    private PowerConsumer consumerBehavior;

    public boolean isSource() {
        return sourceBehavior != null;
    }

    public boolean isConsumer() {
        return consumerBehavior != null;
    }

    public boolean isPureJunction() {
        return !isSource() && !isConsumer();
    }

    public void addPowerQualityEvent(PowerQualityEvent event) {
        this.powerQualityEvents.add(event);
    }
}