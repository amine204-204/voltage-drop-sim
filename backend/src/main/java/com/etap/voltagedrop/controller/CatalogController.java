package com.etap.voltagedrop.controller;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.SwitchCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.TransformerCatalogDocument;
import com.etap.voltagedrop.config.ApiPaths;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiPaths.CATALOGS)
@RequiredArgsConstructor
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

    @GetMapping("/transformers")
    public List<TransformerCatalogDocument> listTransformers() {
        return catalogService.listAllTransformers();
    }

    @GetMapping("/switches")
    public List<SwitchCatalogDocument> listSwitches() {
        return catalogService.listAllSwitches();
    }
}