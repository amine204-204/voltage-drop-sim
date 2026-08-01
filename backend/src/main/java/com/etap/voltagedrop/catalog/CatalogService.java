package com.etap.voltagedrop.catalog;

import com.etap.voltagedrop.catalog.mongo.CableCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.CableCatalogRepository;
import com.etap.voltagedrop.catalog.mongo.SwitchCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.SwitchCatalogRepository;
import com.etap.voltagedrop.catalog.mongo.TransformerCatalogDocument;
import com.etap.voltagedrop.catalog.mongo.TransformerCatalogRepository;
import com.etap.voltagedrop.domain.catalog.BranchComponent;
import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
import com.etap.voltagedrop.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final CableCatalogRepository cableRepo;
    private final TransformerCatalogRepository transformerRepo;
    private final SwitchCatalogRepository switchRepo;

    public CableSpec getCable(String catalogId, String crossSection, String material) {
        CableCatalogDocument doc = null;

        if (catalogId != null && !catalogId.isBlank()) {
            Optional<CableCatalogDocument> byId = cableRepo.findById(catalogId);
            if (byId.isPresent()) {
                doc = byId.get();
            }
        }

        if (doc == null) {
            List<CableCatalogDocument> matches = cableRepo.findByPhysicalConductorMaterialAndPhysicalCrossSection(material, crossSection);
            if (matches.isEmpty()) {
                throw new ResourceNotFoundException(
                        "Cable not found for material=" + material + " crossSection=" + crossSection);
            }
            doc = matches.get(0);
        }

        return new CableSpec(
                doc.getPhysical().getCrossSection(),
                doc.getPhysical().getConductorMaterial(),
                doc.getElectrical().getResistancePerKm(),
                doc.getElectrical().getReactancePerKm()
        );
    }

    public TransformerSpec getTransformer(String catalogId) {
        TransformerCatalogDocument doc = transformerRepo.findById(catalogId)
                .orElseThrow(() -> new ResourceNotFoundException("Transformer not found: " + catalogId));

        TransformerCatalogDocument.ElectricalProperties e = doc.getElectrical();
        return new TransformerSpec(
                e.getImpedancePercent(),
                e.getRatedPowerKva(),
                e.getPrimaryVoltageV(),
                e.getSecondaryVoltageV(),
                e.getNoLoadLossW(),
                e.getLoadLossW()
        );
    }

    public SwitchSpec getSwitch(String catalogId, boolean closed) {
        SwitchCatalogDocument doc = switchRepo.findById(catalogId)
                .orElseThrow(() -> new ResourceNotFoundException("Switch not found: " + catalogId));

        SwitchCatalogDocument.ElectricalProperties e = doc.getElectrical();
        return new SwitchSpec(
                closed,
                e.getRatedCurrentA(),
                e.getBreakingCapacity()
        );
    }

    public List<CableCatalogDocument> listAllCables() {
        return cableRepo.findByActiveTrue();
    }

    public List<TransformerCatalogDocument> listAllTransformers() {
        return transformerRepo.findByActiveTrue();
    }

    public List<SwitchCatalogDocument> listAllSwitches() {
        return switchRepo.findByActiveTrue();
    }

    public List<CableCatalogDocument> listAllCablesAdmin() {
        return cableRepo.findAll();
    }

    public List<TransformerCatalogDocument> listAllTransformersAdmin() {
        return transformerRepo.findAll();
    }

    public List<SwitchCatalogDocument> listAllSwitchesAdmin() {
        return switchRepo.findAll();
    }

    public CableCatalogDocument getCableDetail(String id) {
        return cableRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cable not found: " + id));
    }

    public CableCatalogDocument createCable(CableCatalogDocument cable) {
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

    public TransformerCatalogDocument createTransformer(TransformerCatalogDocument transformer) {
        return transformerRepo.save(transformer);
    }

    public TransformerCatalogDocument updateTransformer(String id, TransformerCatalogDocument transformer) {
        if (!transformerRepo.existsById(id)) {
            throw new ResourceNotFoundException("Transformer not found: " + id);
        }
        transformer.setId(id);
        return transformerRepo.save(transformer);
    }

    public boolean deleteTransformer(String id) {
        if (!transformerRepo.existsById(id)) {
            return false;
        }
        transformerRepo.deleteById(id);
        return true;
    }

    public SwitchCatalogDocument createSwitch(SwitchCatalogDocument sw) {
        return switchRepo.save(sw);
    }

    public SwitchCatalogDocument updateSwitch(String id, SwitchCatalogDocument sw) {
        if (!switchRepo.existsById(id)) {
            throw new ResourceNotFoundException("Switch not found: " + id);
        }
        sw.setId(id);
        return switchRepo.save(sw);
    }

    public boolean deleteSwitch(String id) {
        if (!switchRepo.existsById(id)) {
            return false;
        }
        switchRepo.deleteById(id);
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
