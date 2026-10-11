package com.etap.voltagedrop.domain.catalog;

import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CableSpec implements BranchComponent {
    private String crossSection;
    private String material;
    private double resistancePerKm;
    private double reactancePerKm;
    private double lengthInKm;

    public CableSpec(String crossSection, String material, double resistancePerKm, double reactancePerKm) {
        this.crossSection = crossSection;
        this.material = material;
        this.resistancePerKm = resistancePerKm;
        this.reactancePerKm = reactancePerKm;
    }

    @Override
    public <T> T accept(BranchVisitor<T> visitor) {
        return visitor.visitCable(this);
    }
}