package com.etap.voltagedrop.domain.catalog;

import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CableSpec implements BranchComponent {
    private String crossSection;
    private String material;
    private double resistancePerKm;
    private double reactancePerKm;

    @Override
    public <T> T accept(BranchVisitor<T> visitor) {
        return visitor.visitCable(this);
    }
}