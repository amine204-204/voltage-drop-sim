package com.etap.voltagedrop.service.visitor;

import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;

public class DownstreamNominalVoltageVisitor implements BranchVisitor<Double> {

    private final double upstreamNominalVoltage;

    public DownstreamNominalVoltageVisitor(double upstreamNominalVoltage) {
        this.upstreamNominalVoltage = upstreamNominalVoltage;
    }

    @Override
    public Double visitCable(CableSpec cable) {
        return upstreamNominalVoltage;
    }

    @Override
    public Double visitTransformer(TransformerSpec transformer) {
        return upstreamNominalVoltage / transformer.getTurnsRatio();
    }

    @Override
    public Double visitSwitch(SwitchSpec sw) {
        return upstreamNominalVoltage;
    }
}
