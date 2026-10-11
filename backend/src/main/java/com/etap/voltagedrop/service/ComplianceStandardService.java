package com.etap.voltagedrop.service;

import com.etap.voltagedrop.dto.admin.ComplianceStandardDto;
import com.etap.voltagedrop.persistence.entity.ComplianceStandardEntity;
import com.etap.voltagedrop.repository.jpa.ComplianceStandardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ComplianceStandardService {

    private final ComplianceStandardRepository repository;

    public List<ComplianceStandardDto> listAll() {
        return repository.findAll().stream()
                .map(ComplianceStandardDto::fromEntity)
                .toList();
    }

    public List<ComplianceStandardDto> listActive() {
        return repository.findByActiveTrue().stream()
                .map(ComplianceStandardDto::fromEntity)
                .toList();
    }

    public ComplianceStandardDto findByName(String name) {
        return repository.findByNameIgnoreCase(name)
                .map(ComplianceStandardDto::fromEntity)
                .orElseThrow(() -> new IllegalArgumentException("Compliance standard not found: " + name));
    }

    public ComplianceStandardEntity findEntityByName(String name) {
        return repository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new IllegalArgumentException("Compliance standard not found: " + name));
    }

    @Transactional
    public ComplianceStandardDto create(String name, String description, double minPu, double maxPu, boolean active, boolean isDefault) {
        if (repository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("A compliance standard with name '" + name + "' already exists.");
        }

        if (isDefault) {
            clearDefault();
        }

        ComplianceStandardEntity entity = new ComplianceStandardEntity();
        entity.setName(name);
        entity.setDescription(description);
        entity.setMinVoltagePu(minPu);
        entity.setMaxVoltagePu(maxPu);
        entity.setActive(active);
        entity.setDefaultStandard(isDefault);

        return ComplianceStandardDto.fromEntity(repository.save(entity));
    }

    @Transactional
    public ComplianceStandardDto update(Long id, String name, String description, double minPu, double maxPu, boolean active, boolean isDefault) {
        ComplianceStandardEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Compliance standard not found with id: " + id));

        if (!entity.getName().equalsIgnoreCase(name) && repository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("A compliance standard with name '" + name + "' already exists.");
        }

        if (isDefault) {
            clearDefault();
        }

        entity.setName(name);
        entity.setDescription(description);
        entity.setMinVoltagePu(minPu);
        entity.setMaxVoltagePu(maxPu);
        entity.setActive(active);
        entity.setDefaultStandard(isDefault);

        return ComplianceStandardDto.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        ComplianceStandardEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Compliance standard not found with id: " + id));

        if (entity.isDefaultStandard()) {
            throw new IllegalArgumentException("Cannot delete the default compliance standard.");
        }

        repository.delete(entity);
    }

    private void clearDefault() {
        repository.findByDefaultStandardTrue().ifPresent(existing -> {
            existing.setDefaultStandard(false);
            repository.save(existing);
        });
    }
}
