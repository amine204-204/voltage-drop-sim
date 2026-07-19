package com.etap.voltagedrop.persistence.entity;

import com.etap.voltagedrop.persistence.converter.DoubleListConverter;
import com.etap.voltagedrop.persistence.converter.ControlPointListConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "project_nodes")
@Getter
@Setter
@NoArgsConstructor
public class ProjectNodeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nodeId; // Cytoscape ID

    private String name;
    private String type; // SOURCE, CONSUMER, JUNCTION

    private Double nominalVoltage;
    private String loadType;
    private String selectedPresetId;
    private Double cosPhi;

    @Convert(converter = DoubleListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Double> loadProfile = new ArrayList<>();

    @Convert(converter = ControlPointListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Map<String, Object>> loadProfileControlPoints = new ArrayList<>();

    private double x;
    private double y;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonIgnore
    private ProjectEntity project;
}
