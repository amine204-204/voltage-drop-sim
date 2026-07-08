package com.etap.voltagedrop.service;

import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogService {

    @Value("${simulation.catalog.file}")
    private Resource catalogFile;

    private Map<String, CableSpec> cableCatalog;

    private final ObjectMapper objectMapper;

    @PostConstruct
    public void loadCatalog() {
        try (InputStream inputStream = catalogFile.getInputStream()) {
            List<CableSpec> cables = objectMapper.readValue(inputStream, new TypeReference<>() {});

            this.cableCatalog = cables.stream()
                    .collect(Collectors.toMap(
                            cable -> cable.getCrossSection() + "_" + cable.getMaterial(),
                            Function.identity()
                    ));
            log.info("Successfully loaded {} cable specifications into catalog.", cables.size());
        } catch (Exception e) {
            log.error("Failed to load cable catalog from JSON!", e);
            throw new RuntimeException("Catalog loading failed", e);
        }
    }

    public CableSpec getCableSpec(String crossSection, String material) {
        String lookup_key = crossSection + "_" + material;
        CableSpec cable = cableCatalog.get(lookup_key);
        if (cable == null) {
            throw new IllegalArgumentException("Cable specification not found in catalog: " + lookup_key);
        }
        return cable;
    }
}