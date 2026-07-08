package com.etap.voltagedrop.config;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Component
@Validated
@ConfigurationProperties(prefix = "simulator")
@Getter
public class SimulationProperties {

    private GridSettings grid = new GridSettings();
    private MathAssumptions math = new MathAssumptions();
    private ConvergenceSettings convergence = new ConvergenceSettings();
    private NormSettings norms = new NormSettings();
    private Ieee1159Standards ieee1159 = new Ieee1159Standards();

    @Getter
    public static class GridSettings {
        @NotNull
        private double nominalFrequencyHz = 50.0;
    }

    @Getter
    public static class MathAssumptions {
        @Min(0) @Max(1)
        private double defaultPowerFactor = 0.95;
    }

    @Getter
    public static class ConvergenceSettings {
        private double voltageTolerancePu = 0.0001; // 0.01% accuracy
        private int maxIterations = 50;
    }

    @Getter
    public static class NormSettings {
        private String activeNorm = "en50160";
        private En50160Settings en50160 = new En50160Settings();

    }

    @Getter
    public static class En50160Settings {
        @Min(0) @Max(1)
        private double minVoltagePu = 0.90;  // -10%
        @Min(1) @Max(2)
        private double maxVoltagePu = 1.10;  // +10%
    }

    @Getter
    public static class Ieee1159Standards {
        private double instantaneousSagMaxSeconds = 0.5;
        private double momentarySagMaxSeconds = 3.0;
        private double temporarySagMaxSeconds = 60.0;
    }
}