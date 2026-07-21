package com.etap.voltagedrop.repository.jpa;

import com.etap.voltagedrop.persistence.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
    List<ProjectEntity> findAllByOwnerId(Long ownerId);
    boolean existsByOwnerIdAndName(Long ownerId, String name);
    boolean existsByOwnerIdAndNameAndIdNot(Long ownerId, String name, Long id);
}
