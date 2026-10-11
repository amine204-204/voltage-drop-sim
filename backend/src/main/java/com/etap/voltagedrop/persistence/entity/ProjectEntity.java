package com.etap.voltagedrop.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Long ownerId;

    private int totalTimeSteps;
    private double deltaTimeSeconds;
    private String selectedNormType;
    private Double customMinPu;
    private Double customMaxPu;
    private Double minDeltaTimeSeconds;
    private Double maxDeltaTimeSeconds;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectNodeEntity> nodes = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectBranchEntity> branches = new ArrayList<>();

    @OneToOne(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private SimulationResultEntity simulationResult;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void setNodes(List<ProjectNodeEntity> nodes) {
        this.nodes.clear();
        if (nodes != null) {
            nodes.forEach(n -> n.setProject(this));
            this.nodes.addAll(nodes);
        }
    }

    public void setBranches(List<ProjectBranchEntity> branches) {
        this.branches.clear();
        if (branches != null) {
            branches.forEach(b -> b.setProject(this));
            this.branches.addAll(branches);
        }
    }

    public void setSimulationResult(SimulationResultEntity simulationResult) {
        if (simulationResult == null) {
            if (this.simulationResult != null) {
                this.simulationResult.setProject(null);
            }
        } else {
            simulationResult.setProject(this);
        }
        this.simulationResult = simulationResult;
    }
}
