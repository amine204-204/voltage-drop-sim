package com.etap.voltagedrop.domain.strategy;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class ConstantCurrentStrategy implements LoadBehaviorStrategy {
    private final List<Double> currentProfile;

    @Override
    public double calculateCurrent(double voltageAtNodePu, double localNominalVoltage, int timeStep) {
        if (currentProfile == null || timeStep >= currentProfile.size()) return 0.0;
        return currentProfile.get(timeStep);
    }
}