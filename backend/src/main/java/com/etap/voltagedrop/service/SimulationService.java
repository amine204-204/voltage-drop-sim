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

        classifyPowerQualityEvents(graph, nominalVoltage, deltaTimeSeconds);
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
            totalDownstreamCurrent += node.getConsumerBehavior().getCurrentLoadAtStep(voltagePu, t);
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
                            branch.getLengthInKm(),
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

            NetworkBranch incomingBranch = graph.getIncomingBranch(node.getId());
            if (incomingBranch != null) {
                double parentVoltage = graph.getNodeById(incomingBranch.getFromNodeId()).getWorkingVoltage();
                double voltageDrop = parentVoltage - finalVoltage;
                double nodeNominal = node.getLocalNominalVoltage();
                double dropPercent = (voltageDrop / nodeNominal) * 100.0;

                incomingBranch.getCurrentTimeSeries().add(incomingBranch.getWorkingCurrent());
                incomingBranch.getDropPercentTimeSeries().add(dropPercent);

                double voltagePu = finalVoltage / nodeNominal;

                boolean isCompliant = activeNorm.isCompliant(voltagePu);

                incomingBranch.getStatusTimeSeries().add(isCompliant ? SimulationStatus.OK : SimulationStatus.VIOLATION);
            }
        }
    }

    private void classifyPowerQualityEvents(NetworkGraph graph, double nominalVoltage, double deltaTimeSeconds) {
        for (NetworkBranch branch : graph.getBranches()) {
            int eventStart = -1;
            double worstPu = 1.0;

            for (int t = 0; t < branch.getStatusTimeSeries().size(); t++) {
                if (branch.getStatusTimeSeries().get(t) == SimulationStatus.VIOLATION) {
                    if (eventStart == -1) eventStart = t;

                    NetworkNode downstreamNode = graph.getNodeById(branch.getToNodeId());
                    double currentPu = downstreamNode.getPotentialTimeSeries().get(t) / downstreamNode.getLocalNominalVoltage();
                    if (currentPu < worstPu) worstPu = currentPu;
                } else {
                    if (eventStart != -1) {
                        int eventEnd = t - 1;
                        int durationSteps = (eventEnd - eventStart) + 1;
                        double durationSeconds = durationSteps * deltaTimeSeconds;

                        DisturbanceType type = classifyByDurationSeconds(durationSeconds);
                        branch.addPowerQualityEvent(new PowerQualityEvent(eventStart, eventEnd, worstPu, type));

                        eventStart = -1;
                        worstPu = 1.0;
                    }
                }
            }

            if (eventStart != -1) {
                int eventEnd = branch.getStatusTimeSeries().size() - 1;
                int durationSteps = (eventEnd - eventStart) + 1;
                double durationSeconds = durationSteps * deltaTimeSeconds;
                DisturbanceType type = classifyByDurationSeconds(durationSeconds);
                branch.addPowerQualityEvent(new PowerQualityEvent(eventStart, eventEnd, worstPu, type));
            }
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