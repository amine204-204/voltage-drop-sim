package com.etap.voltagedrop.persistence.entity;

import com.etap.voltagedrop.persistence.converter.DoubleListConverter;
import com.etap.voltagedrop.persistence.converter.StringListConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "node_results")
@Getter
@Setter
@NoArgsConstructor
public class NodeResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nodeId;

    private Double localNominalVoltage;

    @Convert(converter = DoubleListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Double> potentialTimeSeries = new ArrayList<>();

    @Convert(converter = DoubleListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Double> cumulativeDropPercentTimeSeries = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> statusTimeSeries = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> pathBranchIds = new ArrayList<>();

    @OneToMany(mappedBy = "nodeResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PowerQualityEventEntity> powerQualityEvents = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sim_result_id", nullable = false)
    @JsonIgnore
    private SimulationResultEntity simulationResult;

    public void setPowerQualityEvents(List<PowerQualityEventEntity> events) {
        this.powerQualityEvents.clear();
        if (events != null) {
            events.forEach(e -> e.setNodeResult(this));
            this.powerQualityEvents.addAll(events);
        }
    }
}
