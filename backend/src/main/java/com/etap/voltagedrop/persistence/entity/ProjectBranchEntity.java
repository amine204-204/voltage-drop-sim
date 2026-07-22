package com.etap.voltagedrop.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "project_branches")
@Getter
@Setter
@NoArgsConstructor
public class ProjectBranchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String branchId; // Cytoscape ID

    private String name;
    private String fromNodeId;
    private String toNodeId;
    private double lengthInKm;
    private String branchType;
    private String catalogId;
    private String componentCrossSection;
    private String componentMaterial;
    private Boolean closed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonIgnore
    private ProjectEntity project;
}
