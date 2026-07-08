package com.etap.voltagedrop.service;

import com.etap.voltagedrop.config.SimulationProperties;
import com.etap.voltagedrop.domain.*;
import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.norms.En50160NormEvaluator;
import com.etap.voltagedrop.domain.strategy.ConstantCurrentStrategy;
import com.etap.voltagedrop.domain.quality.DisturbanceType;
import com.etap.voltagedrop.domain.quality.SimulationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SimulationServiceTest {

    private SimulationService simulationService;
    private NetworkGraph testGraph;
    private NetworkNode sourceNode;
    private NetworkNode loadNode;
    private NetworkBranch branch;

    @BeforeEach
    void setUp() {
        // 1. Setup properties and the service (Norm is NO LONGER in the constructor)
        SimulationProperties props = new SimulationProperties();
        simulationService = new SimulationService(props);

        // 2. Build a tiny 2-node graph (Source -> Branch -> Load)
        testGraph = new NetworkGraph();

        sourceNode = new NetworkNode();
        sourceNode.setId("SRC");
        sourceNode.setSourceBehavior(new PowerSource(230.0)); // 230V nominal

        loadNode = new NetworkNode();
        loadNode.setId("LOAD");
        // 10 Amps constant current for 2 time steps
        loadNode.setConsumerBehavior(new PowerConsumer(
                new ConstantCurrentStrategy(List.of(10.0, 10.0)),
                0.95 // cosPhi
        ));

        branch = new NetworkBranch();
        branch.setId("BR1");
        branch.setFromNodeId("SRC");
        branch.setToNodeId("LOAD");
        branch.setLengthInKm(1.0); // 1 km
        // Cable: 1 Ohm/km resistance, 0 reactance
        branch.setComponent(new CableSpec("16mm2", 1.0, 0.0));

        testGraph.addNode(sourceNode);
        testGraph.addNode(loadNode);
        testGraph.addBranch(branch);
    }

    @Test
    void testForwardBackwardSweepMath_andBranchDropPercentage() {
        // Arrange: Create the norm to pass into the method
        En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

        // Act: Run simulation for 2 steps, delta-time = 1 second
        simulationService.runChronologicalSimulation(testGraph, 2, 1.0, norm);

        // Assert: Physics Math
        // Expected Drop = I * (R * cosPhi + X * sinPhi)
        // Drop = 10A * (1 Ohm * 0.95 + 0) = 9.5 Volts
        double expectedVoltage = 230.0 - 9.5; // 220.5V

        assertEquals(expectedVoltage, loadNode.getPotentialTimeSeries().get(0), 0.001);
        assertEquals(expectedVoltage, loadNode.getPotentialTimeSeries().get(1), 0.001);

        // Assert: Branch Historical Data (What the UI uses to color the line)
        double expectedDropPercent = (9.5 / 230.0) * 100.0; // 4.1304%
        assertEquals(expectedDropPercent, branch.getDropPercentTimeSeries().get(0), 0.001);
        assertEquals(10.0, branch.getCurrentTimeSeries().get(0), 0.001);
    }

    @Test
    void testNormCompliance_NoEvents() {
        // Arrange
        En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

        // Act
        simulationService.runChronologicalSimulation(testGraph, 1, 1.0, norm);

        // Assert: EN 50160 Status
        // Voltage is 220.5V. Pu = 220.5 / 230 = 0.958 Pu (Strictly > 0.90 limit)
        assertEquals(SimulationStatus.OK, branch.getStatusTimeSeries().get(0));

        // Assert: IEEE 1159 Post-Processor should create NO events
        assertTrue(branch.getPowerQualityEvents().isEmpty());
    }

    @Test
    void testNormViolation_TriggersIeee1159Event() {
        branch.setComponent(new CableSpec("TerribleCable", 10.0, 0.0)); // 10 Ohms!
        En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

        simulationService.runChronologicalSimulation(testGraph, 1, 1.0, norm);

        assertEquals(135.0, loadNode.getPotentialTimeSeries().get(0), 0.001);

        assertEquals(SimulationStatus.VIOLATION, branch.getStatusTimeSeries().get(0));

        assertEquals(1, branch.getPowerQualityEvents().size());

        var event = branch.getPowerQualityEvents().get(0);
        assertEquals(0, event.getStartTimeStep());
        assertEquals(0, event.getEndTimeStep());
        assertEquals(0.586, event.getWorstMagnitudePu(), 0.001);


        assertEquals(DisturbanceType.MOMENTARY_SAG, event.getClassification());
    }
}