package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.domain.*;
import com.etap.voltagedrop.domain.catalog.BranchComponent;
import com.etap.voltagedrop.domain.norms.CustomNormEvaluator;
import com.etap.voltagedrop.domain.norms.NormEvaluator;
import com.etap.voltagedrop.domain.strategy.ConstantCurrentStrategy;
import com.etap.voltagedrop.domain.strategy.ConstantPowerStrategy;
import com.etap.voltagedrop.domain.strategy.LoadBehaviorStrategy;
import com.etap.voltagedrop.dto.SimulationRequestDto;
import com.etap.voltagedrop.service.GraphValidationService;
import com.etap.voltagedrop.service.SimulationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SimulationController {

    private final SimulationService simulationService;
    private final GraphValidationService validationService;
    private final CatalogService catalogService;

    private final Map<String, NormEvaluator> systemNormEvaluators;

    @PostMapping("/run")
    public ResponseEntity<NetworkGraph> runSimulation(@Valid @RequestBody SimulationRequestDto dto) {

        NetworkGraph graph = mapDtoToDomain(dto);

        validationService.validateRadialTree(graph);

        NormEvaluator activeNorm = resolveNorm(dto);

        simulationService.runChronologicalSimulation(
                graph,
                dto.getTotalTimeSteps(),
                dto.getDeltaTimeSeconds(),
                activeNorm
        );

        return ResponseEntity.ok(graph);
    }


    private NormEvaluator resolveNorm(SimulationRequestDto dto) {
        if ("custom".equalsIgnoreCase(dto.getSelectedNormType())) {
            if (dto.getCustomMinPu() == null || dto.getCustomMaxPu() == null) {
                throw new IllegalArgumentException("Custom norm limits must be provided when 'custom' is selected.");
            }
            return new CustomNormEvaluator(dto.getCustomMinPu(), dto.getCustomMaxPu());
        } else {
            NormEvaluator norm = systemNormEvaluators.get(dto.getSelectedNormType());
            if (norm == null) {
                throw new IllegalArgumentException("Unknown system norm selected: " + dto.getSelectedNormType());
            }
            return norm;
        }
    }

    private NetworkGraph mapDtoToDomain(SimulationRequestDto dto) {
        NetworkGraph graph = new NetworkGraph();

        double gridNominalVoltage = 230.0; // Safe fallback default
        for (SimulationRequestDto.NodeDto nodeDto : dto.getGraph().getNodes()) {
            if ("SOURCE".equals(nodeDto.getType()) && nodeDto.getNominalVoltage() != null) {
                gridNominalVoltage = nodeDto.getNominalVoltage();
                break;
            }
        }

        // 2. Second pass: Map Nodes and wire up Load Strategies
        for (SimulationRequestDto.NodeDto nodeDto : dto.getGraph().getNodes()) {
            NetworkNode node = new NetworkNode();
            node.setId(nodeDto.getId());
            node.setName(nodeDto.getName());

            if ("SOURCE".equals(nodeDto.getType())) {
                node.setSourceBehavior(new PowerSource(nodeDto.getNominalVoltage()));

            } else if ("CONSUMER".equals(nodeDto.getType())) {
                LoadBehaviorStrategy strategy = null;

                if ("CONSTANT_CURRENT".equals(nodeDto.getLoadType())) {
                    strategy = new ConstantCurrentStrategy(nodeDto.getLoadProfile());

                } else if ("CONSTANT_POWER".equals(nodeDto.getLoadType())) {
                    strategy = new ConstantPowerStrategy(
                            nodeDto.getLoadProfile(),
                            gridNominalVoltage,
                            nodeDto.getCosPhi()
                    );
                } else {
                    throw new IllegalArgumentException("Unknown load type for node: " + nodeDto.getId());
                }

                node.setConsumerBehavior(new PowerConsumer(strategy, nodeDto.getCosPhi()));

            } else if ("JUNCTION".equals(nodeDto.getType())) {
                //do nothing, a node is treated as a junction if both source and consumer components are null
            } else {
                throw new IllegalArgumentException("Unknown node type: " + nodeDto.getType() + " for node: " + nodeDto.getId());
            }

            graph.addNode(node);
        }

        for (SimulationRequestDto.BranchDto branchDto : dto.getGraph().getBranches()) {
            NetworkBranch branch = new NetworkBranch();
            branch.setId(branchDto.getId());
            branch.setName(branchDto.getName());
            branch.setFromNodeId(branchDto.getFromNodeId());
            branch.setToNodeId(branchDto.getToNodeId());
            branch.setLengthInKm(branchDto.getLengthInKm());

            BranchComponent component = catalogService.getBranchComponent(
                    branchDto.getComponentCrossSection(),
                    branchDto.getComponentMaterial()
            );
            branch.setComponent(component);

            graph.addBranch(branch);
        }

        return graph;
    }
}