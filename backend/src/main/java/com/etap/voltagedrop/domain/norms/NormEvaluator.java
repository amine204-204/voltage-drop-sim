package com.etap.voltagedrop.domain.norms;

public interface NormEvaluator {
    boolean isCompliant(double voltagePu);
    String getStandardName();
}