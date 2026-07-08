package com.etap.voltagedrop.domain.catalog;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CableSpec implements BranchComponent {
    private String crossSection;
    private String material;
    private double resistancePerKm;
    private double reactancePerKm;
}