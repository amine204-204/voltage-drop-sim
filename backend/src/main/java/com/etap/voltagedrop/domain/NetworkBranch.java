package com.etap.voltagedrop.domain;

import com.etap.voltagedrop.domain.catalog.BranchComponent;
import com.etap.voltagedrop.domain.quality.PowerQualityEvent;
import com.etap.voltagedrop.domain.quality.SimulationStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class NetworkBranch {
    private String id;
    private String name;
    private String fromNodeId;
    private String toNodeId;
    private double lengthInKm;

    private BranchComponent component;

    private double workingCurrent;

    private List<Double> currentTimeSeries = new ArrayList<>();
    private List<Double> dropPercentTimeSeries = new ArrayList<>();
    private List<SimulationStatus> statusTimeSeries = new ArrayList<>();
    private List<PowerQualityEvent> powerQualityEvents = new ArrayList<>();

    public void addPowerQualityEvent(PowerQualityEvent event) {
        this.powerQualityEvents.add(event);
    }
}