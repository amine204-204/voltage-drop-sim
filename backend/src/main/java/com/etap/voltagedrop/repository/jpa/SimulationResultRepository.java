package com.etap.voltagedrop.repository.jpa;

import com.etap.voltagedrop.persistence.entity.SimulationResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SimulationResultRepository extends JpaRepository<SimulationResultEntity, Long> {
}
