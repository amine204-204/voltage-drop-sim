package com.etap.voltagedrop.domain;

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

    // Historical Data
    private List<Double> potentialTimeSeries = new ArrayList<>();

    // Working Memory for FBS Algorithm (not serialized to frontend ideally)
    private double workingVoltage;

    @JsonIgnore
    private PowerSource sourceBehavior;
    @JsonIgnore
    private PowerConsumer consumerBehavior;

    public boolean isSource() { return sourceBehavior != null; }
    public boolean isConsumer() { return consumerBehavior != null; }
    public boolean isPureJunction() { return !isSource() && !isConsumer(); }
}