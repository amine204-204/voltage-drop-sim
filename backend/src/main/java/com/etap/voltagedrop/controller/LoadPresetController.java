package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.LoadPresetService;
import com.etap.voltagedrop.catalog.mongo.LoadPresetDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogs")
@RequiredArgsConstructor
public class LoadPresetController {
    private final LoadPresetService presetService;

    @GetMapping("/load-presets")
    public List<LoadPresetDocument> getAllPresets() {
        return presetService.getAllPresets();
    }

    @GetMapping("/load-presets/{id}")
    public LoadPresetDocument getPreset(@PathVariable String id) {
        return presetService.getPreset(id);
    }
}