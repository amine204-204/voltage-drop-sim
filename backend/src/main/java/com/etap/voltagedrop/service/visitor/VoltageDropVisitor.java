package com.etap.voltagedrop.service.visitor;

import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class VoltageDropVisitor implements BranchVisitor<Double> {

    private final double current;
    private final double lengthInKm;
    private final double parentVoltage;
    private final double cosPhi;

    @Override
    public Double visitCable(CableSpec cable) {
        double r = cable.getResistancePerKm() * lengthInKm;
        double x = cable.getReactancePerKm() * lengthInKm;
        return computeVoltageDrop(r, x);
    }

    @Override
    public Double visitTransformer(TransformerSpec transformer) {
        double r = transformer.getEquivalentResistance();
        double x = transformer.getEquivalentReactance();
        double secondaryVoltage = computeVoltageDrop(r, x);
        return secondaryVoltage / transformer.getTurnsRatio();
    }

    @Override
    public Double visitSwitch(SwitchSpec sw) {
        if (!sw.isClosed()) {
            throw new IllegalStateException(
                    "Cannot compute voltage drop across open switch. " +
                            "The forward sweep should have skipped this branch."
            );
        }
        return parentVoltage - (current * sw.getNegligibleImpedanceOhm());
    }

    private double computeVoltageDrop(double r, double x) {
        double phi = Math.acos(cosPhi);
        double z = Math.sqrt(r * r + x * x);
        double theta = Math.atan2(x, r);

        double iz = current * z;
        double angleDiff = theta - phi;

        double realPartVr = parentVoltage - (iz * Math.cos(angleDiff));

        if (realPartVr <= 0) {
            return parentVoltage * 0.01;
        }

        double vrSquared = (parentVoltage * parentVoltage)
                - (2 * parentVoltage * iz * Math.cos(angleDiff))
                + (iz * iz);

        if (vrSquared <= 0) {
            return parentVoltage * 0.01;
        }

        return Math.sqrt(vrSquared);
    }
}
