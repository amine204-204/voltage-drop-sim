package com.etap.voltagedrop.service;

import com.etap.voltagedrop.config.SimulationProperties;
import com.etap.voltagedrop.domain.*;
import com.etap.voltagedrop.domain.norms.NormEvaluator;
import com.etap.voltagedrop.domain.quality.DisturbanceType;
import com.etap.voltagedrop.domain.quality.PowerQualityEvent;
import com.etap.voltagedrop.domain.quality.SimulationStatus;
import com.etap.voltagedrop.service.visitor.ConductivityVisitor;
import com.etap.voltagedrop.service.visitor.DownstreamNominalVoltageVisitor;
import com.etap.voltagedrop.service.visitor.VoltageDropVisitor;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SimulationService {

    private final SimulationProperties props;

    public void runChronologicalSimulation(NetworkGraph graph, int totalTimeSteps, double deltaTimeSeconds, NormEvaluator activeNorm) {
        if (activeNorm == null) {
            throw new IllegalArgumentException("Unknown norm configured: " + props.getNorms().getActiveNorm());
        }

        NetworkNode root = graph.getNodeById(graph.getRootSubstationId());
        if (root == null || !root.isSource()) {
            throw new IllegalArgumentException("Invalid graph: Missing root substation.");
        }

        double nominalVoltage = root.getSourceBehavior().getNominalVoltage();

        for (int t = 0; t < totalTimeSteps; t++) {
            initializeWorkingVoltages(graph, nominalVoltage);

            boolean converged = false;
            int iteration = 0;

            while (!converged && iteration < props.getConvergence().getMaxIterations()) {
                forwardSweepCurrents(graph, root, t, nominalVoltage);
                double maxVoltageError = backwardSweepVoltages(graph, root, nominalVoltage);
                if (maxVoltageError <= props.getConvergence().getVoltageTolerancePu()) {
                    converged = true;
                }
                iteration++;
            }

            if (!converged) {
                throw new IllegalStateException("Simulation failed to converge at time step " + t);
            }

            commitTimeStepAndEvaluateNorms(graph, t, nominalVoltage, activeNorm);
        }

        computeCumulativeDropPercent(graph);
        classifyPowerQualityEvents(graph, deltaTimeSeconds);
        computePaths(graph);
    }

    private void initializeWorkingVoltages(NetworkGraph graph, double nominalVoltage) {
        for (NetworkNode node : graph.getNodes()) {
            node.setWorkingVoltage(nominalVoltage);
            node.setLocalNominalVoltage(nominalVoltage);
        }
    }

    private void forwardSweepCurrents(NetworkGraph graph, NetworkNode node, int t, double nominalVoltage) {
        double totalDownstreamCurrent = 0.0;

        for (NetworkNode child : graph.getChildNodes(node.getId())) {
            NetworkBranch branchToChild = graph.getIncomingBranch(child.getId());

            boolean conducts = branchToChild.getComponent().accept(new ConductivityVisitor());
            if (!conducts) {
                continue;
            }

            forwardSweepCurrents(graph, child, t, nominalVoltage);
            totalDownstreamCurrent += branchToChild.getWorkingCurrent();
        }

        if (node.isConsumer()) {
            double voltagePu = node.getWorkingVoltage() / node.getLocalNominalVoltage();
            totalDownstreamCurrent += node.getConsumerBehavior().getCurrentLoadAtStep(
                    voltagePu, node.getLocalNominalVoltage(), t);
        }

        NetworkBranch incomingBranch = graph.getIncomingBranch(node.getId());
        if (incomingBranch != null) {
            incomingBranch.setWorkingCurrent(totalDownstreamCurrent);
        }
    }

    private double backwardSweepVoltages(NetworkGraph graph, NetworkNode node, double nominalVoltage) {
        double maxErrorPu = 0.0;

        for (NetworkNode child : graph.getChildNodes(node.getId())) {
            NetworkBranch branch = graph.getIncomingBranch(child.getId());

            boolean conducts = branch.getComponent().accept(new ConductivityVisitor());
            if (!conducts) {
                continue;
            }

            double newChildVoltage = branch.getComponent().accept(
                    new VoltageDropVisitor(
                            branch.getWorkingCurrent(),
                            node.getWorkingVoltage(),
                            props.getMath().getDefaultPowerFactor()
                    )
            );

            double newChildNominalVoltage = branch.getComponent().accept(
                    new DownstreamNominalVoltageVisitor(node.getLocalNominalVoltage())
            );
            child.setLocalNominalVoltage(newChildNominalVoltage);

            double oldChildVoltage = child.getWorkingVoltage();
            double errorPu = Math.abs(newChildVoltage - oldChildVoltage) / child.getLocalNominalVoltage();
            if (errorPu > maxErrorPu) {
                maxErrorPu = errorPu;
            }

            child.setWorkingVoltage(newChildVoltage);

            double childError = backwardSweepVoltages(graph, child, nominalVoltage);
            if (childError > maxErrorPu) {
                maxErrorPu = childError;
            }
        }
        return maxErrorPu;
    }

    private void commitTimeStepAndEvaluateNorms(NetworkGraph graph, int t, double nominalVoltage, NormEvaluator activeNorm) {
        for (NetworkNode node : graph.getNodes()) {
            if (node.isSource()) {
                node.getPotentialTimeSeries().add(nominalVoltage);
                continue;
            }

            double finalVoltage = node.getWorkingVoltage();
            node.getPotentialTimeSeries().add(finalVoltage);

            double nodeNominal = node.getLocalNominalVoltage();

            /* Only consumers are connection points, so only they carry a compliance status.
               Junctions and the source have voltage/cumulative-drop diagnostics but no verdict. */
            if (node.isConsumer()) {
                double voltagePu = finalVoltage / nodeNominal;
                boolean isCompliant = activeNorm.isCompliant(voltagePu);
                node.getStatusTimeSeries().add(isCompliant ? SimulationStatus.OK : SimulationStatus.VIOLATION);
            }

            NetworkBranch incomingBranch = graph.getIncomingBranch(node.getId());
            if (incomingBranch != null) {
                double parentVoltage = graph.getNodeById(incomingBranch.getFromNodeId()).getWorkingVoltage();
                double voltageDrop = parentVoltage - finalVoltage;
                double dropPercent = (voltageDrop / nodeNominal) * 100.0;

                incomingBranch.getCurrentTimeSeries().add(incomingBranch.getWorkingCurrent());
                incomingBranch.getDropPercentTimeSeries().add(dropPercent);
            }
        }
    }

    private void computeCumulativeDropPercent(NetworkGraph graph) {
        for (NetworkNode node : graph.getNodes()) {
            if (node.isSource()) {
                continue;
            }

            double nodeNominal = node.getLocalNominalVoltage();
            int steps = node.getPotentialTimeSeries().size();
            List<Double> cumulative = new ArrayList<>(steps);

            for (int t = 0; t < steps; t++) {
                double voltagePu = node.getPotentialTimeSeries().get(t) / nodeNominal;
                cumulative.add((1.0 - voltagePu) * 100.0);
            }

            node.setCumulativeDropPercentTimeSeries(cumulative);
        }
    }

    private void classifyPowerQualityEvents(NetworkGraph graph, double deltaTimeSeconds) {
        for (NetworkNode node : graph.getNodes()) {
            if (!node.isConsumer()) {
                continue;
            }

            int eventStart = -1;
            double worstPu = 1.0;

            for (int t = 0; t < node.getStatusTimeSeries().size(); t++) {
                if (node.getStatusTimeSeries().get(t) == SimulationStatus.VIOLATION) {
                    if (eventStart == -1) eventStart = t;

                    double currentPu = node.getPotentialTimeSeries().get(t) / node.getLocalNominalVoltage();
                    if (currentPu < worstPu) worstPu = currentPu;
                } else {
                    if (eventStart != -1) {
                        int eventEnd = t - 1;
                        int durationSteps = (eventEnd - eventStart) + 1;
                        double durationSeconds = durationSteps * deltaTimeSeconds;

                        DisturbanceType type = classifyByDurationSeconds(durationSeconds);
                        node.addPowerQualityEvent(new PowerQualityEvent(eventStart, eventEnd, worstPu, type));

                        eventStart = -1;
                        worstPu = 1.0;
                    }
                }
            }

            if (eventStart != -1) {
                int eventEnd = node.getStatusTimeSeries().size() - 1;
                int durationSteps = (eventEnd - eventStart) + 1;
                double durationSeconds = durationSteps * deltaTimeSeconds;
                DisturbanceType type = classifyByDurationSeconds(durationSeconds);
                node.addPowerQualityEvent(new PowerQualityEvent(eventStart, eventEnd, worstPu, type));
            }
        }
    }

    private void computePaths(NetworkGraph graph) {
        for (NetworkNode node : graph.getNodes()) {
            List<PathBranchInfo> path = new ArrayList<>();
            String cursor = node.getId();
            int guard = graph.getNodes().size() + 1;

            while (guard-- > 0) {
                NetworkNode cursorNode = graph.getNodeById(cursor);
                if (cursorNode == null || cursorNode.isSource()) {
                    break;
                }

                NetworkBranch incoming = graph.getIncomingBranch(cursor);
                if (incoming == null) {
                    break;
                }

                path.add(new PathBranchInfo(incoming.getId(), incoming.getName()));
                cursor = incoming.getFromNodeId();
            }

            Collections.reverse(path);
            node.setPathBranches(path);
        }
    }

    private DisturbanceType classifyByDurationSeconds(double durationSeconds) {
        if (durationSeconds <= props.getIeee1159().getInstantaneousSagMaxSeconds()) {
            return DisturbanceType.INSTANTANEOUS_SAG;
        }
        if (durationSeconds <= props.getIeee1159().getMomentarySagMaxSeconds()) {
            return DisturbanceType.MOMENTARY_SAG;
        }
        if (durationSeconds <= props.getIeee1159().getTemporarySagMaxSeconds()) {
            return DisturbanceType.TEMPORARY_SAG;
        }
        return DisturbanceType.SUSTAINED_UNDERVOLTAGE;
    }
}