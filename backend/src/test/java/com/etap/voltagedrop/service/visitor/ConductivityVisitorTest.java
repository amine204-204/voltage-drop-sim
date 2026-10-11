package com.etap.voltagedrop.service.visitor;

import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConductivityVisitor")
class ConductivityVisitorTest {

    private final ConductivityVisitor visitor = new ConductivityVisitor();

    @Test
    @DisplayName("cable always conducts")
    void cableConducts() {
        CableSpec cable = new CableSpec("16", "CU", 1.0, 0.0);
        assertTrue(cable.accept(visitor));
    }

    @Test
    @DisplayName("transformer always conducts")
    void transformerConducts() {
        TransformerSpec tx = new TransformerSpec(4.0, 100.0, 20000.0, 400.0, 300.0, 1800.0);
        assertTrue(tx.accept(visitor));
    }

    @Test
    @DisplayName("closed switch conducts")
    void closedSwitchConducts() {
        SwitchSpec sw = new SwitchSpec(true, 100.0, "10kA");
        assertTrue(sw.accept(visitor));
    }

    @Test
    @DisplayName("open switch does not conduct")
    void openSwitchDoesNotConduct() {
        SwitchSpec sw = new SwitchSpec(false, 100.0, "10kA");
        assertFalse(sw.accept(visitor));
    }
}
