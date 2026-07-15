package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CatalogController {
    private final CatalogService catalogService;

    @GetMapping("/cables")
    public List<CableCatalogDocument> listCables() {
        List<CableCatalogDocument> cables = catalogService.listAllCables();
        System.out.println("Returning all cables.., list length: " + cables.size());
        return cables;
    }

    @GetMapping("/cables/{id}")
    public CableCatalogDocument getCable(@PathVariable String id) {
        return catalogService.getCableDetail(id);
    }
}