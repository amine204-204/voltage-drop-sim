package com.etap.voltagedrop.domain;

import com.etap.voltagedrop.domain.catalog.BranchComponent;
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

    private BranchComponent component;

    private double workingCurrent;

    private List<Double> currentTimeSeries = new ArrayList<>();
    private List<Double> dropPercentTimeSeries = new ArrayList<>();
}