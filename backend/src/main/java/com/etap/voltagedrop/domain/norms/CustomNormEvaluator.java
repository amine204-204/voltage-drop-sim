package com.etap.voltagedrop.domain.norms;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Allows the engineer to define project-specific limits via the UI,
 * independent of official regulatory standards.
 */
@Getter
@RequiredArgsConstructor
public class CustomNormEvaluator implements NormEvaluator {

    private final double customMinPu;
    private final double customMaxPu;
    private final String customName;

    public CustomNormEvaluator(double customMinPu, double customMaxPu) {
        this.customMinPu = customMinPu;
        this.customMaxPu = customMaxPu;
        this.customName = "Custom Limit (" + (customMinPu * 100) + "% - " + (customMaxPu * 100) + "%)";
    }

    @Override
    public boolean isCompliant(double voltagePu) {
        return voltagePu >= customMinPu && voltagePu <= customMaxPu;
    }

    @Override
    public String getStandardName() {
        return customName;
    }
}