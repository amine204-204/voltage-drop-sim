package com.etap.voltagedrop.catalog.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoadPresetRepository extends MongoRepository<LoadPresetDocument, String> {
    List<LoadPresetDocument> findByActiveTrue();
    List<LoadPresetDocument> findByLoadType(String loadType);
}