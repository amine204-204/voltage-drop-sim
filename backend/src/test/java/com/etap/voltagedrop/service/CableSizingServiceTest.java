package com.etap.voltagedrop.service;

import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.CableCatalogRepository;
import com.etap.voltagedrop.config.SimulationProperties;
import com.etap.voltagedrop.domain.NetworkBranch;
import com.etap.voltagedrop.domain.NetworkGraph;
import com.etap.voltagedrop.domain.NetworkNode;
import com.etap.voltagedrop.domain.PowerConsumer;
import com.etap.voltagedrop.domain.PowerSource;
import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
import com.etap.voltagedrop.domain.norms.En50160NormEvaluator;
import com.etap.voltagedrop.domain.strategy.ConstantCurrentStrategy;
import com.etap.voltagedrop.dto.CableSizingSuggestionDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CableSizingServiceTest {

    private final CableCatalogRepository cableRepo = mock(CableCatalogRepository.class);
    private final CableSizingService sizingService = new CableSizingService(cableRepo);
    private final SimulationService simulationService = new SimulationService(new SimulationProperties());
    private final En50160NormEvaluator norm = new En50160NormEvaluator(new SimulationProperties());

    @Test
    void suggestsNextLargerSizeForViolatingCableBranch() {
        mockCatalog("cat16", "16mm2", 2.0, "cat25", "25mm2", 1.0, "cat35", "35mm2", 0.7, "cat50", "50mm2", 0.5);

        NetworkGraph graph = singleConsumerGraph(new CableSpec("16mm2", "CU", 5.0, 0.0), 1.0, 10.0);
        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        List<CableSizingSuggestionDto> suggestions = sizingService.generateSuggestions(graph, norm);

        assertEquals(1, suggestions.size());
        CableSizingSuggestionDto s = suggestions.get(0);
        assertEquals("BR1", s.getBranchId());
        assertEquals("25mm2", s.getSuggestedCrossSection());
        assertEquals("cat25", s.getSuggestedCatalogId());
        assertEquals("16mm2", s.getCurrentCrossSection());
        assertEquals("CU", s.getCurrentMaterial());
        assertEquals("cat16", s.getCurrentCatalogId());
        assertTrue(s.getContributionPercent() > 0);
        assertTrue(s.getDropReductionPercent() > 0);
        assertEquals(1, s.getAffectedNodes().size());
        assertEquals("LOAD", s.getAffectedNodes().get(0).getNodeId());
        assertTrue(s.getAffectedNodes().get(0).getPredictedTotalDropPercent() < s.getAffectedNodes().get(0).getTotalDropPercent());
        assertEquals(2, s.getAlternatives().size());
        assertEquals("cat35", s.getAlternatives().get(0).getCatalogId());
    }

    @Test
    void skipsNonViolatingBranches() {
        mockCatalog("cat16", "16mm2", 2.0, "cat25", "25mm2", 1.0);

        NetworkGraph graph = singleConsumerGraph(new CableSpec("16mm2", "CU", 0.1, 0.0), 1.0, 10.0);
        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        assertEquals(0, sizingService.generateSuggestions(graph, norm).size());
    }

    @Test
    void skipsBranchWhenNoLargerCableExists() {
        mockCatalog("cat50", "50mm2", 0.5);

        NetworkGraph graph = singleConsumerGraph(new CableSpec("50mm2", "CU", 5.0, 0.0), 1.0, 10.0);
        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        assertEquals(0, sizingService.generateSuggestions(graph, norm).size());
    }

    @Test
    void skipsNonCableBranches() {
        mockCatalog("cat16", "16mm2", 2.0, "cat25", "25mm2", 1.0);

        NetworkGraph graph = new NetworkGraph();
        NetworkNode source = new NetworkNode();
        source.setId("SRC");
        source.setSourceBehavior(new PowerSource(20000.0));

        NetworkNode load = new NetworkNode();
        load.setId("LOAD");
        load.setConsumerBehavior(new PowerConsumer(new ConstantCurrentStrategy(List.of(80.0)), 0.9));

        NetworkBranch transformer = new NetworkBranch();
        transformer.setId("TX1");
        transformer.setFromNodeId("SRC");
        transformer.setToNodeId("LOAD");
        transformer.setComponent(new TransformerSpec(15.0, 100.0, 20000.0, 400.0, 300.0, 1800.0));

        graph.addNode(source);
        graph.addNode(load);
        graph.addBranch(transformer);

        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        // A transformer feeder cannot be upsized: even a violating consumer yields no suggestion.
        assertTrue(sizingService.generateSuggestions(graph, norm).isEmpty());
    }

    @Test
    void picksTopContributingBranchOfThePath() {
        mockCatalog("cat16", "16mm2", 2.0, "cat25", "25mm2", 1.0);

        NetworkGraph graph = new NetworkGraph();
        NetworkNode source = new NetworkNode();
        source.setId("SRC");
        source.setSourceBehavior(new PowerSource(230.0));

        NetworkNode bus = new NetworkNode();
        bus.setId("BUS");

        NetworkNode load = new NetworkNode();
        load.setId("LOAD");
        load.setConsumerBehavior(new PowerConsumer(new ConstantCurrentStrategy(List.of(10.0)), 0.95));

        NetworkBranch feeder = new NetworkBranch();
        feeder.setId("BR1");
        feeder.setFromNodeId("SRC");
        feeder.setToNodeId("BUS");
        feeder.setComponent(withLength(new CableSpec("16mm2", "CU", 0.5, 0.0), 1.0));

        NetworkBranch drop = new NetworkBranch();
        drop.setId("BR2");
        drop.setFromNodeId("BUS");
        drop.setToNodeId("LOAD");
        drop.setComponent(withLength(new CableSpec("16mm2", "CU", 10.0, 0.0), 1.0));

        graph.addNode(source);
        graph.addNode(bus);
        graph.addNode(load);
        graph.addBranch(feeder);
        graph.addBranch(drop);

        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        List<CableSizingSuggestionDto> suggestions = sizingService.generateSuggestions(graph, norm);
        assertEquals(1, suggestions.size());
        assertEquals("BR2", suggestions.get(0).getBranchId(), "The high-drop last segment should be the target");
    }

    @Test
    void deduplicatesSharedFeederAcrossConsumers() {
        mockCatalog("cat16", "16mm2", 2.0, "cat25", "25mm2", 1.0);

        NetworkGraph graph = new NetworkGraph();
        NetworkNode source = new NetworkNode();
        source.setId("SRC");
        source.setSourceBehavior(new PowerSource(230.0));

        NetworkNode bus = new NetworkNode();
        bus.setId("BUS");

        NetworkNode load1 = new NetworkNode();
        load1.setId("L1");
        load1.setConsumerBehavior(new PowerConsumer(new ConstantCurrentStrategy(List.of(20.0)), 0.95));

        NetworkNode load2 = new NetworkNode();
        load2.setId("L2");
        load2.setConsumerBehavior(new PowerConsumer(new ConstantCurrentStrategy(List.of(20.0)), 0.95));

        NetworkBranch feeder = new NetworkBranch();
        feeder.setId("BR1");
        feeder.setFromNodeId("SRC");
        feeder.setToNodeId("BUS");
        feeder.setComponent(withLength(new CableSpec("16mm2", "CU", 5.0, 0.0), 1.0));

        NetworkBranch drop1 = new NetworkBranch();
        drop1.setId("BR2");
        drop1.setFromNodeId("BUS");
        drop1.setToNodeId("L1");
        drop1.setComponent(withLength(new CableSpec("16mm2", "CU", 2.0, 0.0), 1.0));

        NetworkBranch drop2 = new NetworkBranch();
        drop2.setId("BR3");
        drop2.setFromNodeId("BUS");
        drop2.setToNodeId("L2");
        drop2.setComponent(withLength(new CableSpec("16mm2", "CU", 2.0, 0.0), 1.0));

        graph.addNode(source);
        graph.addNode(bus);
        graph.addNode(load1);
        graph.addNode(load2);
        graph.addBranch(feeder);
        graph.addBranch(drop1);
        graph.addBranch(drop2);

        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        List<CableSizingSuggestionDto> suggestions = sizingService.generateSuggestions(graph, norm);
        assertEquals(1, suggestions.size(), "Shared feeder should be suggested once");
        assertEquals("BR1", suggestions.get(0).getBranchId());
        assertEquals(2, suggestions.get(0).getAffectedNodes().size());
    }

    @Test
    void suggestsAdequateSizeNotJustNextLarger() {
        // 25mm² cannot bring the ~33% drop under the 10% limit; 35mm² can → suggest 35mm², not 25mm².
        mockCatalog("cat16", "16mm2", 8.0, "cat25", "25mm2", 3.0, "cat35", "35mm2", 1.0, "cat50", "50mm2", 0.5);

        NetworkGraph graph = singleConsumerGraph(new CableSpec("16mm2", "CU", 8.0, 0.0), 1.0, 10.0);
        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        List<CableSizingSuggestionDto> suggestions = sizingService.generateSuggestions(graph, norm);
        assertEquals(1, suggestions.size());
        CableSizingSuggestionDto s = suggestions.get(0);
        assertEquals("cat35", s.getSuggestedCatalogId());
        assertEquals("35mm2", s.getSuggestedCrossSection());
        assertEquals(1, s.getAlternatives().size());
        assertEquals("cat50", s.getAlternatives().get(0).getCatalogId());
        assertTrue(s.getAffectedNodes().get(0).getPredictedTotalDropPercent() <= 10.0,
                "the recommended size must predict compliance");
    }

    @Test
    void fallsBackToLargestSizeWhenNoSizeMeetsLimit() {
        // Even the largest same-material cable (50mm²) predicts ~10.3% drop (> 10% limit):
        // best-effort jumps straight to the largest size, not just one step up.
        mockCatalog("cat16", "16mm2", 8.0, "cat25", "25mm2", 6.0, "cat35", "35mm2", 4.0, "cat50", "50mm2", 2.5);

        NetworkGraph graph = singleConsumerGraph(new CableSpec("16mm2", "CU", 8.0, 0.0), 1.0, 10.0);
        simulationService.runChronologicalSimulation(graph, 1, 1.0, norm);

        List<CableSizingSuggestionDto> suggestions = sizingService.generateSuggestions(graph, norm);
        assertEquals(1, suggestions.size());
        CableSizingSuggestionDto s = suggestions.get(0);
        assertEquals("cat50", s.getSuggestedCatalogId());
        assertEquals("50mm2", s.getSuggestedCrossSection());
        assertTrue(s.getAffectedNodes().get(0).getPredictedTotalDropPercent() > 10.0,
                "best-effort prediction stays above the limit, iteration continues across re-runs");
    }

    private void mockCatalog(Object... specs) {
        List<CableCatalogDocument> docs = new java.util.ArrayList<>();
        for (int i = 0; i < specs.length; i += 3) {
            docs.add(cableDoc(String.valueOf(specs[i]), String.valueOf(specs[i + 1]), String.valueOf(specs[i + 2])));
        }
        when(cableRepo.findByPhysicalConductorMaterial("CU")).thenReturn(docs);
    }

    private CableCatalogDocument cableDoc(String id, String crossSection, String r) {
        CableCatalogDocument doc = new CableCatalogDocument();
        doc.setId(id);
        doc.setName("N2XH " + crossSection);
        doc.setActive(true);
        CableCatalogDocument.PhysicalProperties physical = new CableCatalogDocument.PhysicalProperties();
        physical.setCrossSection(crossSection);
        physical.setConductorMaterial("CU");
        doc.setPhysical(physical);
        CableCatalogDocument.ElectricalProperties electrical = new CableCatalogDocument.ElectricalProperties();
        electrical.setResistancePerKm(Double.parseDouble(r));
        electrical.setReactancePerKm(0.0);
        electrical.setAmpacityFreeAirA(200.0);
        doc.setElectrical(electrical);
        return doc;
    }

    private NetworkGraph singleConsumerGraph(CableSpec cable, double lengthKm, double currentA) {
        NetworkGraph graph = new NetworkGraph();

        NetworkNode source = new NetworkNode();
        source.setId("SRC");
        source.setSourceBehavior(new PowerSource(230.0));

        NetworkNode load = new NetworkNode();
        load.setId("LOAD");
        load.setConsumerBehavior(new PowerConsumer(
                new ConstantCurrentStrategy(List.of(currentA)), 0.95));

        NetworkBranch branch = new NetworkBranch();
        branch.setId("BR1");
        branch.setFromNodeId("SRC");
        branch.setToNodeId("LOAD");
        branch.setComponent(withLength(cable, lengthKm));

        graph.addNode(source);
        graph.addNode(load);
        graph.addBranch(branch);
        return graph;
    }

    private CableSpec withLength(CableSpec cable, double lengthKm) {
        cable.setLengthInKm(lengthKm);
        return cable;
    }
}
