package com.etap.voltagedrop.service;

import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.CableCatalogRepository;
import com.etap.voltagedrop.domain.NetworkBranch;
import com.etap.voltagedrop.domain.NetworkGraph;
import com.etap.voltagedrop.domain.NetworkNode;
import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.norms.NormEvaluator;
import com.etap.voltagedrop.domain.quality.SimulationStatus;
import com.etap.voltagedrop.dto.CableSizingSuggestionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Path-aware cable sizing. Compliance is owned by the consumer node; a consumer undervoltage is caused
 * by the whole source→consumer branch chain. For each violating consumer we rank the branches on its
 * path by their simulated local drop and recommend upsizing the top contributor that can bring the
 * consumer back into compliance (AGENTS.md §6: no custom R/X, catalog-driven).
 *
 * <p>The recommended size is the <b>smallest catalog cable of the same material</b> whose predicted
 * total drop meets the norm limit — not merely the next size up, which may fall short. The prediction
 * is first-order: the branch's local drop is scaled by the impedance-magnitude ratio of the new cable.
 * If even the largest same-material size cannot reach the limit on any path branch, the top upsizable
 * branch is recommended one step up as a best effort and the iterative loop (apply → re-run → re-rank)
 * continues. Shared feeders are deduplicated: one branch upsizing covers every consumer it benefits,
 * sized to satisfy the consumer that needs the largest cross-section.
 */
@Service
@RequiredArgsConstructor
public class CableSizingService {

    private static final int MAX_ALTERNATIVES = 2;
    private static final double EPSILON = 1e-9;

    private final CableCatalogRepository cableRepo;

    public List<CableSizingSuggestionDto> generateSuggestions(NetworkGraph graph, NormEvaluator activeNorm) {
        double dropLimitPercent = (1.0 - activeNorm.getMinVoltagePu()) * 100.0;
        Map<String, SuggestionAccumulator> byBranch = new LinkedHashMap<>();
        Map<String, List<CableCatalogDocument>> catalogCache = new HashMap<>();

        for (NetworkNode consumer : graph.getNodes()) {
            if (!consumer.isConsumer() || !hasViolation(consumer)) continue;

            int worstStep = worstViolationStep(consumer);
            if (worstStep < 0) continue;

            double totalDrop = cumulativeDropAt(consumer, worstStep);
            if (totalDrop <= 0) continue;

            NetworkBranch fallbackBranch = null;
            CableSpec fallbackCable = null;
            List<CableCatalogDocument> fallbackCatalog = null;
            List<CableCatalogDocument> fallbackLarger = null;

            for (NetworkBranch branch : rankedCablePath(graph, consumer, worstStep)) {
                CableSpec cable = (CableSpec) branch.getComponent();
                List<CableCatalogDocument> catalog = catalogCache.computeIfAbsent(
                        branch.getId(), id -> sameMaterialSorted(cable));
                List<CableCatalogDocument> larger = largerThan(catalog, cable.getCrossSection());
                if (larger.isEmpty()) continue; // this branch cannot be upsized, try the next path branch

                if (fallbackBranch == null) {
                    fallbackBranch = branch;
                    fallbackCable = cable;
                    fallbackCatalog = catalog;
                    fallbackLarger = larger;
                }

                double localDrop = branch.getDropPercentTimeSeries().get(worstStep);
                CableCatalogDocument required = smallestAdequate(larger, cable, totalDrop, localDrop, dropLimitPercent);
                if (required == null) continue; // even the largest same-material size falls short here

                accumulator(byBranch, branch, cable, catalog, larger)
                        .addAffectedNode(consumer, totalDrop, localDrop, required);
                fallbackBranch = null; // solved: no best-effort needed for this consumer
                break;
            }

            /* Best effort when no single upsizing reaches the limit: jump straight to the largest
               same-material size — if even that can't comply, maximize the reduction in one apply. */
            if (fallbackBranch != null) {
                double localDrop = fallbackBranch.getDropPercentTimeSeries().get(worstStep);
                accumulator(byBranch, fallbackBranch, fallbackCable, fallbackCatalog, fallbackLarger)
                        .addAffectedNode(consumer, totalDrop, localDrop,
                                fallbackLarger.get(fallbackLarger.size() - 1));
            }
        }

        return byBranch.values().stream().map(SuggestionAccumulator::toDto).toList();
    }

    private SuggestionAccumulator accumulator(Map<String, SuggestionAccumulator> byBranch, NetworkBranch branch,
                                              CableSpec cable, List<CableCatalogDocument> catalog,
                                              List<CableCatalogDocument> larger) {
        return byBranch.computeIfAbsent(branch.getId(), id ->
                new SuggestionAccumulator(branch, cable, findCurrentDoc(catalog, cable.getCrossSection()), larger));
    }

    private boolean hasViolation(NetworkNode node) {
        return node.getStatusTimeSeries().stream().anyMatch(s -> s == SimulationStatus.VIOLATION);
    }

    /** Step of the deepest cumulative drop among violating steps. */
    private int worstViolationStep(NetworkNode node) {
        List<SimulationStatus> status = node.getStatusTimeSeries();
        List<Double> cumulative = node.getCumulativeDropPercentTimeSeries();
        int worst = -1;
        double worstDrop = -1;
        int len = Math.min(status.size(), cumulative.size());
        for (int i = 0; i < len; i++) {
            if (status.get(i) == SimulationStatus.VIOLATION && cumulative.get(i) > worstDrop) {
                worstDrop = cumulative.get(i);
                worst = i;
            }
        }
        return worst;
    }

    private double cumulativeDropAt(NetworkNode node, int step) {
        List<Double> cumulative = node.getCumulativeDropPercentTimeSeries();
        return (cumulative != null && step >= 0 && step < cumulative.size()) ? cumulative.get(step) : 0;
    }

    /** Source→node path branches that are cables, ranked by simulated local drop (top contributor first). */
    private List<NetworkBranch> rankedCablePath(NetworkGraph graph, NetworkNode consumer, int step) {
        return consumer.getPathBranches().stream()
                .map(pb -> graph.getBranchById(pb.branchId()))
                .filter(Objects::nonNull)
                .filter(b -> b.getComponent() instanceof CableSpec)
                .filter(b -> b.getDropPercentTimeSeries() != null && step < b.getDropPercentTimeSeries().size())
                .sorted(Comparator.comparingDouble((NetworkBranch b) -> b.getDropPercentTimeSeries().get(step)).reversed())
                .toList();
    }

    private List<CableCatalogDocument> sameMaterialSorted(CableSpec cable) {
        return cableRepo.findByPhysicalConductorMaterial(cable.getMaterial()).stream()
                .filter(CableCatalogDocument::isActive)
                .filter(d -> d.getPhysical() != null && d.getPhysical().getCrossSection() != null)
                .filter(d -> d.getElectrical() != null)
                .sorted(Comparator.comparingDouble(d -> parseMm2(d.getPhysical().getCrossSection())))
                .toList();
    }

    private List<CableCatalogDocument> largerThan(List<CableCatalogDocument> catalog, String currentCrossSection) {
        double currentSize = parseMm2(currentCrossSection);
        return catalog.stream()
                .filter(d -> parseMm2(d.getPhysical().getCrossSection()) > currentSize)
                .toList();
    }

    /** Smallest catalog cable whose predicted total drop meets the limit; null if none does. */
    private CableCatalogDocument smallestAdequate(List<CableCatalogDocument> larger, CableSpec cable,
                                                  double totalDrop, double localDrop, double dropLimitPercent) {
        for (CableCatalogDocument doc : larger) {
            if (predictedTotalFor(cable, doc, totalDrop, localDrop) <= dropLimitPercent + EPSILON) {
                return doc;
            }
        }
        return null;
    }

    private CableCatalogDocument findCurrentDoc(List<CableCatalogDocument> catalog, String crossSection) {
        return catalog.stream()
                .filter(d -> d.getPhysical().getCrossSection().equalsIgnoreCase(crossSection))
                .findFirst()
                .orElse(null);
    }

    /** First-order estimate: replace only this branch's local drop by the new cable's, scaled by |Z| ratio. */
    private static double predictedTotalFor(CableSpec current, CableCatalogDocument candidate,
                                            double totalDrop, double localDrop) {
        return totalDrop - localDrop + localDrop * impedanceRatio(current, candidate);
    }

    private static double impedanceRatio(CableSpec current, CableCatalogDocument candidate) {
        double currentZ = Math.hypot(current.getResistancePerKm(), current.getReactancePerKm());
        double newZ = Math.hypot(candidate.getElectrical().getResistancePerKm(),
                candidate.getElectrical().getReactancePerKm());
        if (currentZ <= 0) return 1.0;
        return newZ / currentZ;
    }

    private static double parseMm2(String crossSection) {
        if (crossSection == null) return 0;
        String num = crossSection.replaceAll("[^0-9.]", "");
        try {
            return Double.parseDouble(num);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** Mutable per-branch accumulator so the same branch recommendation can be shared across consumers. */
    private static final class SuggestionAccumulator {

        private final String branchId;
        private final String branchName;
        private final String currentCatalogId;
        private final String currentCrossSection;
        private final String currentMaterial;
        private final CableSpec cable;
        private final List<CableCatalogDocument> largerDocs;

        private final List<AffectedNodeData> affected = new ArrayList<>();
        private CableCatalogDocument target; // largest chosen size across consumers
        private double referenceTotalDrop;
        private double referenceLocalDrop;

        SuggestionAccumulator(NetworkBranch branch, CableSpec cable, CableCatalogDocument currentDoc,
                              List<CableCatalogDocument> largerDocs) {
            this.branchId = branch.getId();
            this.branchName = branch.getName();
            this.cable = cable;
            this.currentCatalogId = currentDoc != null ? currentDoc.getId() : null;
            this.currentCrossSection = cable.getCrossSection();
            this.currentMaterial = cable.getMaterial();
            this.largerDocs = largerDocs;
        }

        void addAffectedNode(NetworkNode node, double totalDrop, double localDrop, CableCatalogDocument chosen) {
            affected.add(new AffectedNodeData(node.getId(), node.getName(), totalDrop, localDrop));
            if (target == null || parseMm2(chosen.getPhysical().getCrossSection()) > parseMm2(target.getPhysical().getCrossSection())) {
                target = chosen;
            }
            if (totalDrop > referenceTotalDrop) {
                referenceTotalDrop = totalDrop;
                referenceLocalDrop = localDrop;
            }
        }

        CableSizingSuggestionDto toDto() {
            double ratio = impedanceRatio(cable, target);
            double referencePredicted = referenceTotalDrop - referenceLocalDrop + referenceLocalDrop * ratio;
            double contribution = referenceTotalDrop > 0 ? (referenceLocalDrop / referenceTotalDrop) * 100.0 : 0;
            double reduction = Math.max(0, referenceTotalDrop - referencePredicted);

            List<CableSizingSuggestionDto.AlternativeCableDto> alternatives = largerDocs.stream()
                    .filter(d -> parseMm2(d.getPhysical().getCrossSection()) > parseMm2(target.getPhysical().getCrossSection()))
                    .limit(MAX_ALTERNATIVES)
                    .map(d -> CableSizingSuggestionDto.AlternativeCableDto.builder()
                            .catalogId(d.getId())
                            .crossSection(d.getPhysical().getCrossSection())
                            .name(d.getName())
                            .predictedTotalDropPercent(predictedTotalFor(cable, d, referenceTotalDrop, referenceLocalDrop))
                            .build())
                    .toList();

            return CableSizingSuggestionDto.builder()
                    .branchId(branchId)
                    .branchName(branchName)
                    .currentCatalogId(currentCatalogId)
                    .currentCrossSection(currentCrossSection)
                    .currentMaterial(currentMaterial)
                    .suggestedCatalogId(target.getId())
                    .suggestedCrossSection(target.getPhysical().getCrossSection())
                    .suggestedName(target.getName())
                    .contributionPercent(contribution)
                    .dropReductionPercent(reduction)
                    .affectedNodes(affected.stream()
                            .map(a -> CableSizingSuggestionDto.AffectedNodeDto.builder()
                                    .nodeId(a.nodeId)
                                    .nodeName(a.nodeName)
                                    .totalDropPercent(a.totalDrop)
                                    .predictedTotalDropPercent(a.totalDrop - a.localDrop + a.localDrop * ratio)
                                    .build())
                            .toList())
                    .alternatives(alternatives)
                    .build();
        }

        private record AffectedNodeData(String nodeId, String nodeName, double totalDrop, double localDrop) {
        }
    }
}
