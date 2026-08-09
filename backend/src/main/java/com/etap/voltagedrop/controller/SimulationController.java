package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.config.ApiPaths;
import com.etap.voltagedrop.domain.*;
import com.etap.voltagedrop.domain.catalog.BranchComponent;
import com.etap.voltagedrop.domain.norms.CustomNormEvaluator;
import com.etap.voltagedrop.domain.norms.DatabaseNormEvaluator;
import com.etap.voltagedrop.domain.norms.NormEvaluator;
import com.etap.voltagedrop.domain.strategy.ConstantCurrentStrategy;
import com.etap.voltagedrop.domain.strategy.ConstantPowerStrategy;
import com.etap.voltagedrop.domain.strategy.LoadBehaviorStrategy;
import com.etap.voltagedrop.dto.SimulationRequestDto;
import com.etap.voltagedrop.dto.SimulationResponseDto;
import com.etap.voltagedrop.persistence.entity.ComplianceStandardEntity;
import com.etap.voltagedrop.service.BranchComponentFactory;
import com.etap.voltagedrop.service.ComplianceStandardService;
import com.etap.voltagedrop.service.GraphValidationService;
import com.etap.voltagedrop.service.SimulationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiPaths.SIMULATIONS)
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;
    private final GraphValidationService validationService;
    private final BranchComponentFactory branchComponentFactory;
    private final ComplianceStandardService complianceStandardService;

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<SimulationResponseDto> runSimulation(@Valid @RequestBody SimulationRequestDto dto) {

        NetworkGraph graph = mapDtoToDomain(dto);

        validationService.validateRadialTree(graph);

        NormEvaluator activeNorm = resolveNorm(dto);

        simulationService.runChronologicalSimulation(
                graph,
                dto.getTotalTimeSteps(),
                dto.getDeltaTimeSeconds(),
                activeNorm
        );

        return ResponseEntity.ok(toResponseDto(graph));
    }

    private SimulationResponseDto toResponseDto(NetworkGraph graph) {
        SimulationResponseDto dto = new SimulationResponseDto();

        dto.setNodes(graph.getNodes().stream().map(node -> {
            SimulationResponseDto.NodeResultDto n = new SimulationResponseDto.NodeResultDto();
            n.setId(node.getId());
            n.setName(node.getName());
            n.setType(node.isSource() ? "SOURCE" : (node.isConsumer() ? "CONSUMER" : "JUNCTION"));
            n.setLocalNominalVoltage(node.getLocalNominalVoltage());
            n.setPotentialTimeSeries(node.getPotentialTimeSeries());
            n.setCumulativeDropPercentTimeSeries(node.getCumulativeDropPercentTimeSeries());
            n.setStatusTimeSeries(node.getStatusTimeSeries());
            n.setPowerQualityEvents(node.getPowerQualityEvents().stream().map(pq -> {
                SimulationResponseDto.PowerQualityEventDto e = new SimulationResponseDto.PowerQualityEventDto();
                e.setStartTimeStep(pq.getStartTimeStep());
                e.setEndTimeStep(pq.getEndTimeStep());
                e.setWorstMagnitudePu(pq.getWorstMagnitudePu());
                e.setClassification(pq.getClassification());
                return e;
            }).toList());
            n.setPathBranches(node.getPathBranches().stream().map(pb -> {
                SimulationResponseDto.PathBranchDto p = new SimulationResponseDto.PathBranchDto();
                p.setBranchId(pb.branchId());
                p.setBranchName(pb.branchName());
                return p;
            }).toList());
            return n;
        }).toList());

        dto.setBranches(graph.getBranches().stream().map(branch -> {
            SimulationResponseDto.BranchResultDto b = new SimulationResponseDto.BranchResultDto();
            b.setId(branch.getId());
            b.setCurrentTimeSeries(branch.getCurrentTimeSeries());
            b.setDropPercentTimeSeries(branch.getDropPercentTimeSeries());
            return b;
        }).toList());

        return dto;
    }


    private NormEvaluator resolveNorm(SimulationRequestDto dto) {
        if ("custom".equalsIgnoreCase(dto.getSelectedNormType())) {
            if (dto.getCustomMinPu() == null || dto.getCustomMaxPu() == null) {
                throw new IllegalArgumentException("Custom norm limits must be provided when 'custom' is selected.");
            }
            return new CustomNormEvaluator(dto.getCustomMinPu(), dto.getCustomMaxPu());
        } else {
            ComplianceStandardEntity standard = complianceStandardService.findEntityByName(dto.getSelectedNormType());
            return new DatabaseNormEvaluator(standard);
        }
    }

    private NetworkGraph mapDtoToDomain(SimulationRequestDto dto) {
        NetworkGraph graph = new NetworkGraph();

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

            BranchComponent component = branchComponentFactory.create(branchDto);
            branch.setComponent(component);

            graph.addBranch(branch);
        }

        return graph;
    }
}