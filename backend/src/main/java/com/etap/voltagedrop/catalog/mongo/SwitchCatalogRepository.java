package com.etap.voltagedrop.catalog.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SwitchCatalogRepository extends MongoRepository<SwitchCatalogDocument, String> {
    List<SwitchCatalogDocument> findByActiveTrue();
}
