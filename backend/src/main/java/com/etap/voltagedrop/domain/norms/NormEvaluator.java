package com.etap.voltagedrop.domain.norms;

public interface NormEvaluator {
    boolean isCompliant(double voltagePu);
    String getStandardName();

    /** Lower voltage bound (pu). The allowed voltage-drop is derived from it: (1 - min) × 100 %. */
    double getMinVoltagePu();
}