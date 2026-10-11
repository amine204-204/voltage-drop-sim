package com.etap.voltagedrop.domain.strategy;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class ConstantPowerStrategy implements LoadBehaviorStrategy {
    private final List<Double> powerProfileWatts;
    private final double cosPhi;

    @Override
    public double calculateCurrent(double voltageAtNodePu, double localNominalVoltage, int timeStep) {
        if (powerProfileWatts == null || timeStep >= powerProfileWatts.size()) return 0.0;

        double safeVoltagePu = Math.max(voltageAtNodePu, 0.05);

        double power = powerProfileWatts.get(timeStep);
        double actualVoltage = localNominalVoltage * safeVoltagePu;
        return power / (actualVoltage * cosPhi);
    }
}
