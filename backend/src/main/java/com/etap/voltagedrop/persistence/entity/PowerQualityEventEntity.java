package com.etap.voltagedrop.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pq_events")
@Getter
@Setter
@NoArgsConstructor
public class PowerQualityEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int startTimeStep;
    private int endTimeStep;
    private double worstMagnitudePu;
    private String classification; // Enum value name

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_result_id", nullable = false)
    @JsonIgnore
    private BranchResultEntity branchResult;
}
