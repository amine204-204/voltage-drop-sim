package com.etap.voltagedrop.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "compliance_standards")
@Getter
@Setter
@NoArgsConstructor
public class ComplianceStandardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String description = "";

    @Column(name = "min_voltage_pu", nullable = false)
    private double minVoltagePu = 0.90;

    @Column(name = "max_voltage_pu", nullable = false)
    private double maxVoltagePu = 1.10;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "is_default", nullable = false)
    private boolean defaultStandard = false;

    @Column(name = "created_at")
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
}
