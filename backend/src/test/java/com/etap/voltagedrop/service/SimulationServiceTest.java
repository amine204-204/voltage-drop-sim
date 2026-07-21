package com.etap.voltagedrop.service;

import com.etap.voltagedrop.config.SimulationProperties;
import com.etap.voltagedrop.domain.*;
import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
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
        // 1. Setup properties and the service
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
        branch.setComponent(new CableSpec("16mm2", "CU", 1.0, 0.0));

        testGraph.addNode(sourceNode);
        testGraph.addNode(loadNode);
        testGraph.addBranch(branch);
    }

    @Test
    void testForwardBackwardSweepMath_andBranchDropPercentage() {
        // Arrange
        En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

        // Act
        simulationService.runChronologicalSimulation(testGraph, 2, 1.0, norm);

        // Assert: Physics Math (Using exact quadratic formula)
        // Vr = sqrt(Vs² - 2*Vs*I*Z*cos(phi) + (I*Z)²)
        double vs = 230.0;
        double i = 10.0;
        double z = 1.0; // sqrt(R² + X²) = sqrt(1² + 0²)
        double cosPhi = 0.95;

        double expectedVoltage = Math.sqrt((vs * vs) - (2 * vs * i * z * cosPhi) + Math.pow(i * z, 2));

        assertEquals(expectedVoltage, loadNode.getPotentialTimeSeries().get(0), 0.001);
        assertEquals(expectedVoltage, loadNode.getPotentialTimeSeries().get(1), 0.001);

        // Assert: Branch Historical Data (What the UI uses to color the line)
        double actualDrop = vs - expectedVoltage;
        double expectedDropPercent = (actualDrop / vs) * 100.0;

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
        // Voltage will be ~220.52V. Pu = 220.52 / 230 ≈ 0.958 Pu (Strictly > 0.90 limit)
        assertEquals(SimulationStatus.OK, branch.getStatusTimeSeries().get(0));

        // Assert: IEEE 1159 Post-Processor should create NO events
        assertTrue(branch.getPowerQualityEvents().isEmpty());
    }

    @Test
    void testNormViolation_TriggersIeee1159Event() {
        branch.setComponent(new CableSpec("TerribleCable", "AL", 10.0, 0.0)); // 10 Ohms!
        En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

        simulationService.runChronologicalSimulation(testGraph, 1, 1.0, norm);

        // Assert: Using exact quadratic formula with Z = 10
        double vs = 230.0;
        double i = 10.0;
        double z = 10.0; // sqrt(10² + 0²)
        double cosPhi = 0.95;

        double expectedVoltage = Math.sqrt((vs * vs) - (2 * vs * i * z * cosPhi) + Math.pow(i * z, 2));
        double expectedPu = expectedVoltage / vs;

        assertEquals(expectedVoltage, loadNode.getPotentialTimeSeries().get(0), 0.001);

        assertEquals(SimulationStatus.VIOLATION, branch.getStatusTimeSeries().get(0));

        assertEquals(1, branch.getPowerQualityEvents().size());

        var event = branch.getPowerQualityEvents().get(0);
        assertEquals(0, event.getStartTimeStep());
        assertEquals(0, event.getEndTimeStep());
        assertEquals(expectedPu, event.getWorstMagnitudePu(), 0.001);

        assertEquals(DisturbanceType.MOMENTARY_SAG, event.getClassification());
    }

    @Test
    void testTransformerBranch_convergesAndAppliesTurnsRatio() {
        NetworkGraph graph = new NetworkGraph();

        NetworkNode source = new NetworkNode();
        source.setId("SRC");
        source.setSourceBehavior(new PowerSource(20000.0));

        NetworkNode secondary = new NetworkNode();
        secondary.setId("SEC");
        secondary.setConsumerBehavior(new PowerConsumer(
                new ConstantCurrentStrategy(List.of(50.0)),
                0.9
        ));

        NetworkBranch txBranch = new NetworkBranch();
        txBranch.setId("TX1");
        txBranch.setFromNodeId("SRC");
        txBranch.setToNodeId("SEC");
        txBranch.setLengthInKm(0.0);
        txBranch.setComponent(new TransformerSpec(4.0, 100.0, 20000.0, 400.0, 300.0, 1800.0));

        graph.addNode(source);
        graph.addNode(secondary);
        graph.addBranch(txBranch);

        En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        double secondaryVoltage = secondary.getPotentialTimeSeries().get(0);
        assertTrue(secondaryVoltage > 0 && secondaryVoltage < 500.0,
                "Secondary voltage should be in reasonable range, got: " + secondaryVoltage);
    }

    @Test
    void testOpenSwitch_createsIslandWithZeroCurrent() {
        NetworkGraph graph = new NetworkGraph();

        NetworkNode source = new NetworkNode();
        source.setId("SRC");
        source.setSourceBehavior(new PowerSource(230.0));

        NetworkNode busbar = new NetworkNode();
        busbar.setId("BUS");

        NetworkNode load = new NetworkNode();
        load.setId("LOAD");
        load.setConsumerBehavior(new PowerConsumer(
                new ConstantCurrentStrategy(List.of(10.0)),
                0.95
        ));

        NetworkBranch cableToBus = new NetworkBranch();
        cableToBus.setId("BR_CABLE");
        cableToBus.setFromNodeId("SRC");
        cableToBus.setToNodeId("BUS");
        cableToBus.setLengthInKm(0.1);
        cableToBus.setComponent(new CableSpec("16", "CU", 1.0, 0.0));

        NetworkBranch openSwitch = new NetworkBranch();
        openSwitch.setId("BR_SWITCH");
        openSwitch.setFromNodeId("BUS");
        openSwitch.setToNodeId("LOAD");
        openSwitch.setLengthInKm(0.0);
        openSwitch.setComponent(new SwitchSpec(false, 100.0, "10kA"));

        graph.addNode(source);
        graph.addNode(busbar);
        graph.addNode(load);
        graph.addBranch(cableToBus);
        graph.addBranch(openSwitch);

        En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        assertEquals(0.0, openSwitch.getWorkingCurrent(), 0.001,
                "Open switch should have zero working current");
    }
}