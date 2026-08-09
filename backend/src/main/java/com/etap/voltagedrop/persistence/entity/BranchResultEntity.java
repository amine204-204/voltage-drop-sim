package com.etap.voltagedrop.persistence.entity;

import com.etap.voltagedrop.persistence.converter.DoubleListConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "branch_results")
@Getter
@Setter
@NoArgsConstructor
public class BranchResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String branchId;

    @Convert(converter = DoubleListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Double> currentTimeSeries = new ArrayList<>();

    @Convert(converter = DoubleListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<Double> dropPercentTimeSeries = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sim_result_id", nullable = false)
    @JsonIgnore
    private SimulationResultEntity simulationResult;
}
