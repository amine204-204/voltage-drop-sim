package com.etap.voltagedrop.domain.norms;

import com.etap.voltagedrop.config.SimulationProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("en50160")
@RequiredArgsConstructor
public class En50160NormEvaluator implements NormEvaluator {

    private final SimulationProperties props;

    @Override
    public boolean isCompliant(double voltagePu) {
        double min = props.getNorms().getEn50160().getMinVoltagePu();
        double max = props.getNorms().getEn50160().getMaxVoltagePu();
        return voltagePu >= min && voltagePu <= max;
    }

    @Override
    public String getStandardName() {
        return "EN 50160";
    }
}