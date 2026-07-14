package com.etap.voltagedrop.domain.strategy;

import lombok.AllArgsConstructor;

import java.util.List;

@AllArgsConstructor
public class ConstantPowerStrategy implements LoadBehaviorStrategy {
    private final List<Double> powerProfileWatts;
    private final double nominalVoltage;
    private final double cosPhi;

    @Override
    public double calculateCurrent(double voltageAtNodePu, int timeStep) {
        if (powerProfileWatts == null || timeStep >= powerProfileWatts.size()) return 0.0;

        double safeVoltagePu = Math.max(voltageAtNodePu, 0.05);

        double power = powerProfileWatts.get(timeStep);
        double actualVoltage = nominalVoltage * safeVoltagePu;
        return power / (actualVoltage * cosPhi);
    }
}