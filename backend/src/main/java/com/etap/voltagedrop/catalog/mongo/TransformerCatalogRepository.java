package com.etap.voltagedrop.catalog.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransformerCatalogRepository extends MongoRepository<TransformerCatalogDocument, String> {
    List<TransformerCatalogDocument> findByActiveTrue();
}
