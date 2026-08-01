package com.etap.voltagedrop.domain.strategy;

public interface LoadBehaviorStrategy {
    double calculateCurrent(double voltageAtNodePu, double localNominalVoltage, int timeStep);
}