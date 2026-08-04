package com.etap.voltagedrop.repository.jpa;

import com.etap.voltagedrop.persistence.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
    List<ProjectEntity> findAllByOwnerId(Long ownerId);
    boolean existsByOwnerIdAndName(Long ownerId, String name);
    boolean existsByOwnerIdAndNameAndIdNot(Long ownerId, String name, Long id);

    @Query("SELECT p.name, COUNT(b) FROM ProjectBranchEntity b JOIN b.project p WHERE b.catalogId = :catalogId GROUP BY p.name ORDER BY p.name")
    List<Object[]> countBranchReferencesByCatalogId(@Param("catalogId") String catalogId);

    @Query("SELECT p.name, COUNT(n) FROM ProjectNodeEntity n JOIN n.project p WHERE n.selectedPresetId = :presetId GROUP BY p.name ORDER BY p.name")
    List<Object[]> countNodeReferencesByPresetId(@Param("presetId") String presetId);
}
