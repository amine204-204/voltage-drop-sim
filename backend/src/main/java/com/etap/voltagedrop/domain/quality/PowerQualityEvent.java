package com.etap.voltagedrop.domain.quality;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PowerQualityEvent {
    private int startTimeStep;
    private int endTimeStep;
    private double worstMagnitudePu;
    private DisturbanceType classification;

    public int getDurationSteps() {
        return (endTimeStep - startTimeStep) + 1;
    }
}