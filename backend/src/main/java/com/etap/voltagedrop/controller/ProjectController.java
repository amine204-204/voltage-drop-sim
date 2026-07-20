package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.dto.ProjectDto;
import com.etap.voltagedrop.dto.ProjectSummaryDto;
import com.etap.voltagedrop.dto.SaveProjectDto;
import com.etap.voltagedrop.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectSummaryDto>> getAllProjects() {
        return ResponseEntity.ok(projectService.listAllProjects());
    }

    @GetMapping("/{id}")
    public ProjectDto getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody SaveProjectDto dto) {
        return ResponseEntity.ok(projectService.saveProject(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ProjectDto updateProject(@PathVariable Long id, @Valid @RequestBody SaveProjectDto dto) {
        return projectService.updateProject(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok().build();
    }
}
