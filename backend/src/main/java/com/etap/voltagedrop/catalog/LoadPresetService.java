package com.etap.voltagedrop.catalog;

import com.etap.voltagedrop.catalog.mongo.LoadPresetDocument;
import com.etap.voltagedrop.catalog.mongo.LoadPresetRepository;
import com.etap.voltagedrop.dto.admin.CatalogUsageDto;
import com.etap.voltagedrop.exception.ResourceNotFoundException;
import com.etap.voltagedrop.repository.jpa.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LoadPresetService {
    private final LoadPresetRepository presetRepo;
    private final ProjectRepository projectRepository;

    public List<LoadPresetDocument> getAllPresets() {
        return presetRepo.findByActiveTrue();
    }

    public List<LoadPresetDocument> getPresetsByType(String loadType) {
        return presetRepo.findByLoadType(loadType);
    }

    public LoadPresetDocument getPreset(String id) {
        return presetRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Preset not found: " + id));
    }

    public List<LoadPresetDocument> listAllPresetsAdmin() {
        return presetRepo.findAll();
    }

    public LoadPresetDocument createPreset(LoadPresetDocument preset) {
        if (preset.getId() == null || preset.getId().isBlank()) {
            preset.setId(null);
        }
        if (!preset.isActive()) {
            preset.setActive(true);
        }
        return presetRepo.save(preset);
    }

    public LoadPresetDocument updatePreset(String id, LoadPresetDocument preset) {
        if (!presetRepo.existsById(id)) {
            throw new ResourceNotFoundException("Preset not found: " + id);
        }
        preset.setId(id);
        return presetRepo.save(preset);
    }

    public boolean deletePreset(String id) {
        LoadPresetDocument doc = presetRepo.findById(id).orElse(null);
        if (doc == null) {
            return false;
        }
        CatalogUsageDto.checkNotReferenced(projectRepository.countNodeReferencesByPresetId(id), "load preset", doc.getName());
        presetRepo.deleteById(id);
        return true;
    }

    public CatalogUsageDto getPresetUsage(String id) {
        return CatalogUsageDto.fromRows(projectRepository.countNodeReferencesByPresetId(id));
    }
}
