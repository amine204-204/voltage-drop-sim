package com.etap.voltagedrop.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sim_results")
@Getter
@Setter
@NoArgsConstructor
public class SimulationResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private ProjectEntity project;

    private LocalDateTime runAt;

    private Double minLimitPu;

    private Double maxLimitPu;

    @OneToMany(mappedBy = "simulationResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NodeResultEntity> nodesResults = new ArrayList<>();

    @OneToMany(mappedBy = "simulationResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BranchResultEntity> branchesResults = new ArrayList<>();

    public void setNodesResults(List<NodeResultEntity> nodesResults) {
        this.nodesResults.clear();
        if (nodesResults != null) {
            nodesResults.forEach(nr -> nr.setSimulationResult(this));
            this.nodesResults.addAll(nodesResults);
        }
    }

    public void setBranchesResults(List<BranchResultEntity> branchesResults) {
        this.branchesResults.clear();
        if (branchesResults != null) {
            branchesResults.forEach(br -> br.setSimulationResult(this));
            this.branchesResults.addAll(branchesResults);
        }
    }
}
