package com.etap.voltagedrop.dto.admin;

import com.etap.voltagedrop.exception.ConflictException;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class CatalogUsageDto {
    private List<ProjectReferenceDto> projects = new ArrayList<>();

    public static CatalogUsageDto fromRows(List<Object[]> rows) {
        CatalogUsageDto dto = new CatalogUsageDto();
        for (Object[] row : rows) {
            dto.getProjects().add(new ProjectReferenceDto(
                    (String) row[0],
                    (Long) row[1]
            ));
        }
        return dto;
    }

    public static void checkNotReferenced(List<Object[]> rows, String itemType, String itemName) {
        List<ProjectReferenceDto> references = fromRows(rows).getProjects();
        if (references.isEmpty()) {
            return;
        }
        String refs = references.stream()
                .map(r -> r.getProjectName() + " (" + r.getBranchCount()
                        + " branch" + (r.getBranchCount() == 1 ? "" : "es") + ")")
                .collect(Collectors.joining(", "));
        String displayName = itemName == null ? itemType : itemName;
        throw new ConflictException("Cannot delete " + itemType + " \"" + displayName
                + "\": referenced by " + refs + ". Delete or rewire the projects first.");
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectReferenceDto {
        private String projectName;
        private long branchCount;
    }
}
