package com.etap.voltagedrop.catalog;

import com.etap.voltagedrop.catalog.mongo.LoadPresetDocument;
import com.etap.voltagedrop.catalog.mongo.LoadPresetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LoadPresetService {
    private final LoadPresetRepository presetRepo;

    public List<LoadPresetDocument> getAllPresets() {
        return presetRepo.findByActiveTrue();
    }

    public List<LoadPresetDocument> getPresetsByType(String loadType) {
        return presetRepo.findByLoadType(loadType);
    }

    public LoadPresetDocument getPreset(String id) {
        return presetRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Preset not found: " + id));
    }
}