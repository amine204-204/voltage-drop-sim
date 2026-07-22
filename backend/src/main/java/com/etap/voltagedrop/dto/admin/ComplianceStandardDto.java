package com.etap.voltagedrop.dto.admin;

import com.etap.voltagedrop.persistence.entity.ComplianceStandardEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComplianceStandardDto {

    private Long id;
    private String name;
    private String description;
    private double minVoltagePu;
    private double maxVoltagePu;
    private boolean active;
    private boolean defaultStandard;

    public static ComplianceStandardDto fromEntity(ComplianceStandardEntity entity) {
        ComplianceStandardDto dto = new ComplianceStandardDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setMinVoltagePu(entity.getMinVoltagePu());
        dto.setMaxVoltagePu(entity.getMaxVoltagePu());
        dto.setActive(entity.isActive());
        dto.setDefaultStandard(entity.isDefaultStandard());
        return dto;
    }
}
