package com.etap.voltagedrop.domain.catalog;

import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TransformerSpec implements BranchComponent {
    private double impedancePercent;
    private double ratedPowerKva;
    private double primaryVoltageV;
    private double secondaryVoltageV;
    private double noLoadLossW;
    private double loadLossW;

    @Override
    public <T> T accept(BranchVisitor<T> visitor) {
        return visitor.visitTransformer(this);
    }

    public double getTurnsRatio() {
        return primaryVoltageV / secondaryVoltageV;
    }

    public double getEquivalentResistance() {
        double sRated = ratedPowerKva * 1000;
        double iRated = sRated / (Math.sqrt(3) * secondaryVoltageV);
        return loadLossW / (3 * iRated * iRated);
    }

    public double getEquivalentReactance() {
        double zBase = (secondaryVoltageV * secondaryVoltageV) / (ratedPowerKva * 1000);
        double zActual = (impedancePercent / 100.0) * zBase;
        double r = getEquivalentResistance();
        return Math.sqrt(zActual * zActual - r * r);
    }
}
