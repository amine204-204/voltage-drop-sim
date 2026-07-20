package com.etap.voltagedrop.catalog;

import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.CableCatalogRepository;
import com.etap.voltagedrop.domain.catalog.BranchComponent;
import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final CableCatalogRepository cableRepo;

    public BranchComponent getBranchComponent(String crossSection, String material) {
        String lookupId = material + "-" + crossSection;
        CableCatalogDocument doc = cableRepo.findById(lookupId)
                .orElseThrow(() -> new ResourceNotFoundException("Cable not found: " + lookupId));

        return new CableSpec(
                doc.getPhysical().getCrossSection(),
                doc.getPhysical().getConductorMaterial(),
                doc.getElectrical().getResistancePerKm(),
                doc.getElectrical().getReactancePerKm()
        );
    }

    public List<CableCatalogDocument> listAllCables() {
        return cableRepo.findByActiveTrue();
    }

    public List<CableCatalogDocument> listAllCablesAdmin() {
        return cableRepo.findAll();
    }

    public CableCatalogDocument getCableDetail(String id) {
        return cableRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cable not found: " + id));
    }

    public CableCatalogDocument createCable(CableCatalogDocument cable) {
        cable.setId(null);
        return cableRepo.save(cable);
    }

    public CableCatalogDocument updateCable(String id, CableCatalogDocument cable) {
        if (!cableRepo.existsById(id)) {
            throw new ResourceNotFoundException("Cable not found: " + id);
        }
        cable.setId(id);
        return cableRepo.save(cable);
    }

    public boolean deleteCable(String id) {
        if (!cableRepo.existsById(id)) {
            return false;
        }
        cableRepo.deleteById(id);
        return true;
    }

    public double getImpedanceAtTemp(String id, double tempC) {
        CableCatalogDocument doc = cableRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cable not found: " + id));
        return doc.getImpedanceTable().stream()
                .filter(i -> i.getTempC() >= tempC)
                .findFirst()
                .map(i -> Math.sqrt(i.getROhmKm() * i.getROhmKm() + i.getXOhmKm() * i.getXOhmKm()))
                .orElseThrow(() -> new IllegalArgumentException("Temperature out of range"));
    }
}
