package com.etap.voltagedrop.domain;

import com.etap.voltagedrop.domain.strategy.ConstantCurrentStrategy;
import com.etap.voltagedrop.domain.strategy.LoadBehaviorStrategy;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PowerConsumer {

    private LoadBehaviorStrategy loadStrategy;
    private double cosPhi;

    public double getCurrentLoadAtStep(double voltageAtNodePu, double localNominalVoltage, int timeStep) {
        return loadStrategy.calculateCurrent(voltageAtNodePu, localNominalVoltage, timeStep);
    }

    public double calculateSinPhi() {
        return Math.sqrt(1 - (cosPhi * cosPhi));
    }
}