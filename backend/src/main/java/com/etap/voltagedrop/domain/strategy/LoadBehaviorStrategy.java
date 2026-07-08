package com.etap.voltagedrop.domain.strategy;

public interface LoadBehaviorStrategy {
    double calculateCurrent(double voltageAtNodePu, int timeStep);
}