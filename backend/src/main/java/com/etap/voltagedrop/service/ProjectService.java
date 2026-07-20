package com.etap.voltagedrop.service;

import com.etap.voltagedrop.dto.ProjectDto;
import com.etap.voltagedrop.dto.ProjectSummaryDto;
import com.etap.voltagedrop.dto.SaveProjectDto;
import com.etap.voltagedrop.exception.ResourceNotFoundException;
import com.etap.voltagedrop.persistence.entity.*;
import com.etap.voltagedrop.repository.jpa.ProjectRepository;
import com.etap.voltagedrop.repository.jpa.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return null;
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .map(UserEntity::getId)
                .orElse(null);
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            return auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        }
        return false;
    }

    private void assertOwnerOrAdmin(ProjectEntity project) {
        if (isAdmin()) return;
        Long userId = getCurrentUserId();
        if (project.getOwnerId() == null || !project.getOwnerId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this project");
        }
    }

    public List<ProjectSummaryDto> listAllProjects() {
        Long userId = getCurrentUserId();
        List<ProjectEntity> projects;

        if (isAdmin()) {
            projects = projectRepository.findAll();
        } else {
            projects = projectRepository.findAllByOwnerId(userId);
        }

        return projects.stream()
                .map(p -> new ProjectSummaryDto(
                        p.getId(),
                        p.getName(),
                        p.getDescription(),
                        p.getOwnerId(),
                        p.getCreatedAt(),
                        p.getUpdatedAt()
                ))
                .sorted((p1, p2) -> p2.getUpdatedAt().compareTo(p1.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    public ProjectDto getProjectById(Long id) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        assertOwnerOrAdmin(project);
        return mapEntityToDto(project);
    }

    public ProjectDto saveProject(SaveProjectDto dto) {
        ProjectEntity project = new ProjectEntity();
        project.setOwnerId(getCurrentUserId());
        updateProjectEntityFromDto(project, dto);
        ProjectEntity saved = projectRepository.save(project);
        return mapEntityToDto(saved);
    }

    public ProjectDto updateProject(Long id, SaveProjectDto dto) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        assertOwnerOrAdmin(project);
        updateProjectEntityFromDto(project, dto);
        ProjectEntity saved = projectRepository.save(project);
        return mapEntityToDto(saved);
    }

    public void deleteProject(Long id) {
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        assertOwnerOrAdmin(project);
        projectRepository.deleteById(id);
    }

    private void updateProjectEntityFromDto(ProjectEntity project, SaveProjectDto dto) {
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setTotalTimeSteps(dto.getTotalTimeSteps());
        project.setDeltaTimeSeconds(dto.getDeltaTimeSeconds());
        project.setSelectedNormType(dto.getSelectedNormType());
        project.setCustomMinPu(dto.getCustomMinPu());
        project.setCustomMaxPu(dto.getCustomMaxPu());

        List<ProjectNodeEntity> nodes = new ArrayList<>();
        if (dto.getNodes() != null) {
            for (SaveProjectDto.NodeDto nodeDto : dto.getNodes()) {
                ProjectNodeEntity node = new ProjectNodeEntity();
                node.setNodeId(nodeDto.getId());
                node.setName(nodeDto.getName());
                node.setType(nodeDto.getType());
                node.setNominalVoltage(nodeDto.getNominalVoltage());
                node.setLoadType(nodeDto.getLoadType());
                node.setSelectedPresetId(nodeDto.getSelectedPresetId());
                node.setCosPhi(nodeDto.getCosPhi());
                node.setLoadProfile(nodeDto.getLoadProfile());
                node.setLoadProfileControlPoints(nodeDto.getLoadProfileControlPoints());
                node.setX(nodeDto.getX());
                node.setY(nodeDto.getY());
                nodes.add(node);
            }
        }
        project.setNodes(nodes);

        List<ProjectBranchEntity> branches = new ArrayList<>();
        if (dto.getBranches() != null) {
            for (SaveProjectDto.BranchDto branchDto : dto.getBranches()) {
                ProjectBranchEntity branch = new ProjectBranchEntity();
                branch.setBranchId(branchDto.getId());
                branch.setName(branchDto.getName());
                branch.setFromNodeId(branchDto.getFromNodeId());
                branch.setToNodeId(branchDto.getToNodeId());
                branch.setLengthInKm(branchDto.getLengthInKm());
                branch.setCatalogId(branchDto.getCatalogId());
                branch.setComponentCrossSection(branchDto.getComponentCrossSection());
                branch.setComponentMaterial(branchDto.getComponentMaterial());
                branches.add(branch);
            }
        }
        project.setBranches(branches);

        if (dto.getSimulationResult() != null) {
            SimulationResultEntity simResult = new SimulationResultEntity();
            simResult.setRunAt(LocalDateTime.now());
            simResult.setProject(project);

            List<NodeResultEntity> nodesResults = new ArrayList<>();
            if (dto.getSimulationResult().getNodesResults() != null) {
                for (SaveProjectDto.NodeResultDto nrDto : dto.getSimulationResult().getNodesResults()) {
                    NodeResultEntity nr = new NodeResultEntity();
                    nr.setNodeId(nrDto.getNodeId());
                    nr.setPotentialTimeSeries(nrDto.getPotentialTimeSeries());
                    nr.setSimulationResult(simResult);
                    nodesResults.add(nr);
                }
            }
            simResult.setNodesResults(nodesResults);

            List<BranchResultEntity> branchesResults = new ArrayList<>();
            if (dto.getSimulationResult().getBranchesResults() != null) {
                for (SaveProjectDto.BranchResultDto brDto : dto.getSimulationResult().getBranchesResults()) {
                    BranchResultEntity br = new BranchResultEntity();
                    br.setBranchId(brDto.getBranchId());
                    br.setCurrentTimeSeries(brDto.getCurrentTimeSeries());
                    br.setDropPercentTimeSeries(brDto.getDropPercentTimeSeries());
                    br.setStatusTimeSeries(brDto.getStatusTimeSeries());
                    br.setSimulationResult(simResult);

                    List<PowerQualityEventEntity> events = new ArrayList<>();
                    if (brDto.getPowerQualityEvents() != null) {
                        for (SaveProjectDto.PowerQualityEventDto pqDto : brDto.getPowerQualityEvents()) {
                            PowerQualityEventEntity pq = new PowerQualityEventEntity();
                            pq.setStartTimeStep(pqDto.getStartTimeStep());
                            pq.setEndTimeStep(pqDto.getEndTimeStep());
                            pq.setWorstMagnitudePu(pqDto.getWorstMagnitudePu());
                            pq.setClassification(pqDto.getClassification());
                            pq.setBranchResult(br);
                            events.add(pq);
                        }
                    }
                    br.setPowerQualityEvents(events);
                    branchesResults.add(br);
                }
            }
            simResult.setBranchesResults(branchesResults);

            project.setSimulationResult(simResult);
        } else {
            project.setSimulationResult(null);
        }
    }

    private ProjectDto mapEntityToDto(ProjectEntity p) {
        ProjectDto dto = new ProjectDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setOwnerId(p.getOwnerId());
        dto.setTotalTimeSteps(p.getTotalTimeSteps());
        dto.setDeltaTimeSeconds(p.getDeltaTimeSeconds());
        dto.setSelectedNormType(p.getSelectedNormType());
        dto.setCustomMinPu(p.getCustomMinPu());
        dto.setCustomMaxPu(p.getCustomMaxPu());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());

        dto.setNodes(p.getNodes().stream().map(node -> {
            ProjectDto.NodeDto n = new ProjectDto.NodeDto();
            n.setId(node.getNodeId());
            n.setName(node.getName());
            n.setType(node.getType());
            n.setNominalVoltage(node.getNominalVoltage());
            n.setLoadType(node.getLoadType());
            n.setSelectedPresetId(node.getSelectedPresetId());
            n.setCosPhi(node.getCosPhi());
            n.setLoadProfile(node.getLoadProfile());
            n.setLoadProfileControlPoints(node.getLoadProfileControlPoints());
            n.setX(node.getX());
            n.setY(node.getY());
            return n;
        }).collect(Collectors.toList()));

        dto.setBranches(p.getBranches().stream().map(branch -> {
            ProjectDto.BranchDto b = new ProjectDto.BranchDto();
            b.setId(branch.getBranchId());
            b.setName(branch.getName());
            b.setFromNodeId(branch.getFromNodeId());
            b.setToNodeId(branch.getToNodeId());
            b.setLengthInKm(branch.getLengthInKm());
            b.setCatalogId(branch.getCatalogId());
            b.setComponentCrossSection(branch.getComponentCrossSection());
            b.setComponentMaterial(branch.getComponentMaterial());
            return b;
        }).collect(Collectors.toList()));

        if (p.getSimulationResult() != null) {
            ProjectDto.SimulationResultDto sr = new ProjectDto.SimulationResultDto();
            
            sr.setNodesResults(p.getSimulationResult().getNodesResults().stream().map(nr -> {
                ProjectDto.NodeResultDto nrDto = new ProjectDto.NodeResultDto();
                nrDto.setNodeId(nr.getNodeId());
                nrDto.setPotentialTimeSeries(nr.getPotentialTimeSeries());
                return nrDto;
            }).collect(Collectors.toList()));

            sr.setBranchesResults(p.getSimulationResult().getBranchesResults().stream().map(br -> {
                ProjectDto.BranchResultDto brDto = new ProjectDto.BranchResultDto();
                brDto.setBranchId(br.getBranchId());
                brDto.setCurrentTimeSeries(br.getCurrentTimeSeries());
                brDto.setDropPercentTimeSeries(br.getDropPercentTimeSeries());
                brDto.setStatusTimeSeries(br.getStatusTimeSeries());
                
                brDto.setPowerQualityEvents(br.getPowerQualityEvents().stream().map(pq -> {
                    ProjectDto.PowerQualityEventDto pqDto = new ProjectDto.PowerQualityEventDto();
                    pqDto.setStartTimeStep(pq.getStartTimeStep());
                    pqDto.setEndTimeStep(pq.getEndTimeStep());
                    pqDto.setWorstMagnitudePu(pq.getWorstMagnitudePu());
                    pqDto.setClassification(pq.getClassification());
                    return pqDto;
                }).collect(Collectors.toList()));

                return brDto;
            }).collect(Collectors.toList()));

            dto.setSimulationResult(sr);
        }

        return dto;
    }
}
