package com.etap.voltagedrop.catalog.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CableCatalogRepository extends MongoRepository<CableCatalogDocument, String> {
    List<CableCatalogDocument> findByActiveTrue();
    List<CableCatalogDocument> findByPhysicalConductorMaterial(String material);

    @Query("{ 'electical.ampacityFreeAirA': { $gte: ?0 } }")
    List<CableCatalogDocument> findByMinAmpacity(double ampacity);
}