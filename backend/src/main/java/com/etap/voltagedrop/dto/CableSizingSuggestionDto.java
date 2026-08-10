package com.etap.voltagedrop.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * One recommended cable upsizing. A single suggestion is a branch-level fix (deduplicated across
 * the consumers it benefits): replacing one path cable with the next larger catalog size, same
 * conductor material. Drop predictions are first-order estimates derived from the simulated
 * per-branch local drops; the engineer verifies by re-running the simulation after applying.
 */
@Getter
@Builder
public class CableSizingSuggestionDto {

    private String branchId;
    private String branchName;

    private String currentCatalogId;
    private String currentCrossSection;
    private String currentMaterial;

    private String suggestedCatalogId;
    private String suggestedCrossSection;
    private String suggestedName;

    /** Share of the affected node's total drop contributed by this branch (worst affected node). */
    private double contributionPercent;

    /** Estimated reduction of the affected node's total drop if this upsizing is applied (worst affected node). */
    private double dropReductionPercent;

    /** Consumers whose path drop this single upsizing targets, each with before/after estimates. */
    private List<AffectedNodeDto> affectedNodes;

    /** Next larger catalog sizes of the same material, for user choice. */
    private List<AlternativeCableDto> alternatives;

    @Getter
    @Builder
    public static class AffectedNodeDto {
        private String nodeId;
        private String nodeName;
        private double totalDropPercent;
        private double predictedTotalDropPercent;
    }

    @Getter
    @Builder
    public static class AlternativeCableDto {
        private String catalogId;
        private String crossSection;
        private String name;
        /** Estimated total drop at the worst affected node if this alternative is applied. */
        private double predictedTotalDropPercent;
    }
}
