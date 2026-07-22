package com.etap.voltagedrop.service;

import com.etap.voltagedrop.catalog.CatalogService;
import com.etap.voltagedrop.domain.catalog.BranchComponent;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.dto.SimulationRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BranchComponentFactory {

    private final CatalogService catalogService;

    public BranchComponent create(SimulationRequestDto.BranchDto branchDto) {
        String branchType = branchDto.getBranchType();

        if (branchType == null) {
            branchType = "CABLE";
        }

        return switch (branchType) {
            case "CABLE" -> catalogService.getCable(
                    branchDto.getCatalogId(),
                    branchDto.getComponentCrossSection(),
                    branchDto.getComponentMaterial()
            );
            case "TRANSFORMER" -> catalogService.getTransformer(branchDto.getCatalogId());
            case "SWITCH" -> catalogService.getSwitch(
                    branchDto.getCatalogId(),
                    branchDto.isClosed()
            );
            default -> throw new IllegalArgumentException("Unknown branch type: " + branchType);
        };
    }
}
