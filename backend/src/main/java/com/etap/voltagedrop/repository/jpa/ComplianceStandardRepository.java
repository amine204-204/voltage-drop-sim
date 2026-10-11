package com.etap.voltagedrop.repository.jpa;

import com.etap.voltagedrop.persistence.entity.ComplianceStandardEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplianceStandardRepository extends JpaRepository<ComplianceStandardEntity, Long> {
    Optional<ComplianceStandardEntity> findByNameIgnoreCase(String name);
    Optional<ComplianceStandardEntity> findByDefaultStandardTrue();
    List<ComplianceStandardEntity> findByActiveTrue();
    boolean existsByNameIgnoreCase(String name);
}
