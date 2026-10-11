package com.etap.voltagedrop.domain.catalog;

import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SwitchSpec implements BranchComponent {
    private static final double NEGLIGIBLE_IMPEDANCE_OHM = 0.0001;

    private boolean closed;
    private double ratedCurrentA;
    private String breakingCapacity;

    @Override
    public <T> T accept(BranchVisitor<T> visitor) {
        return visitor.visitSwitch(this);
    }

    public double getNegligibleImpedanceOhm() {
        return NEGLIGIBLE_IMPEDANCE_OHM;
    }
}
