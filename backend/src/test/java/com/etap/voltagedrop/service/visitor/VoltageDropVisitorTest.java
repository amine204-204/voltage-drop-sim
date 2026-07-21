package com.etap.voltagedrop.service.visitor;

import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("VoltageDropVisitor")
class VoltageDropVisitorTest {

    @Nested
    @DisplayName("visitCable")
    class CableTest {

        @Test
        @DisplayName("cable drop increases with length")
        void cableDropIncreasesWithLength() {
            CableSpec cable = new CableSpec("16", "CU", 1.15, 0.08);

            VoltageDropVisitor shortVisitor = new VoltageDropVisitor(10.0, 1.0, 230.0, 0.9);
            double voltageAt1km = cable.accept(shortVisitor);

            VoltageDropVisitor longVisitor = new VoltageDropVisitor(10.0, 2.0, 230.0, 0.9);
            double voltageAt2km = cable.accept(longVisitor);

            assertTrue(voltageAt2km < voltageAt1km,
                    "Voltage at 2km should be lower than at 1km");
        }

        @Test
        @DisplayName("cable drop increases with current")
        void cableDropIncreasesWithCurrent() {
            CableSpec cable = new CableSpec("16", "CU", 1.0, 0.0);

            VoltageDropVisitor lowCurrent = new VoltageDropVisitor(5.0, 1.0, 230.0, 0.95);
            double voltageLow = cable.accept(lowCurrent);

            VoltageDropVisitor highCurrent = new VoltageDropVisitor(20.0, 1.0, 230.0, 0.95);
            double voltageHigh = cable.accept(highCurrent);

            assertTrue(voltageHigh < voltageLow,
                    "Higher current should produce lower voltage");
        }

        @Test
        @DisplayName("zero-reactance cable matches simplified formula")
        void zeroReactanceCable() {
            CableSpec cable = new CableSpec("16", "CU", 1.0, 0.0);

            VoltageDropVisitor visitor = new VoltageDropVisitor(10.0, 1.0, 230.0, 0.95);
            double vr = cable.accept(visitor);

            double expected = Math.sqrt(
                    230.0 * 230.0
                            - 2 * 230.0 * 10.0 * 1.0 * 0.95
                            + 10.0 * 10.0 * 1.0 * 1.0
            );
            assertEquals(expected, vr, 0.001);
        }
    }

    @Nested
    @DisplayName("visitTransformer")
    class TransformerTest {

        @Test
        @DisplayName("transformer applies turns ratio to secondary voltage")
        void transformerAppliesTurnsRatio() {
            TransformerSpec tx = new TransformerSpec(4.0, 100.0, 20000.0, 400.0, 300.0, 1800.0);
            VoltageDropVisitor visitor = new VoltageDropVisitor(50.0, 0.0, 20000.0, 0.9);

            double secondaryV = tx.accept(visitor);

            assertTrue(secondaryV > 0 && secondaryV < 400.0,
                    "Secondary voltage should be positive and less than 400V nominal");
        }

        @Test
        @DisplayName("transformer with zero current outputs nominal secondary voltage")
        void transformerZeroCurrent() {
            TransformerSpec tx = new TransformerSpec(4.0, 100.0, 20000.0, 400.0, 300.0, 1800.0);
            VoltageDropVisitor visitor = new VoltageDropVisitor(0.0, 0.0, 20000.0, 0.9);

            double secondaryV = tx.accept(visitor);

            assertEquals(400.0, secondaryV, 0.1,
                    "With zero current, secondary voltage should be exactly nominal (20000/50)");
        }
    }

    @Nested
    @DisplayName("visitSwitch")
    class SwitchTest {

        @Test
        @DisplayName("closed switch produces negligible drop")
        void closedSwitchNegligibleDrop() {
            SwitchSpec sw = new SwitchSpec(true, 100.0, "10kA");
            VoltageDropVisitor visitor = new VoltageDropVisitor(10.0, 0.0, 230.0, 0.9);

            double vr = sw.accept(visitor);

            assertEquals(230.0 - (10.0 * 0.0001), vr, 0.001);
        }

        @Test
        @DisplayName("open switch throws IllegalStateException")
        void openSwitchThrows() {
            SwitchSpec sw = new SwitchSpec(false, 100.0, "10kA");
            VoltageDropVisitor visitor = new VoltageDropVisitor(10.0, 0.0, 230.0, 0.9);

            assertThrows(IllegalStateException.class, () -> sw.accept(visitor),
                    "Open switch should throw — forward sweep should have skipped it");
        }
    }
}
