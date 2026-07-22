package com.etap.voltagedrop.domain.norms;

import com.etap.voltagedrop.persistence.entity.ComplianceStandardEntity;

public class DatabaseNormEvaluator implements NormEvaluator {

    private final ComplianceStandardEntity standard;

    public DatabaseNormEvaluator(ComplianceStandardEntity standard) {
        this.standard = standard;
    }

    @Override
    public boolean isCompliant(double voltagePu) {
        return voltagePu >= standard.getMinVoltagePu() && voltagePu <= standard.getMaxVoltagePu();
    }

    @Override
    public String getStandardName() {
        return standard.getName();
    }
}
