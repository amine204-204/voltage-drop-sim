package com.etap.voltagedrop.domain.catalog;

import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;

public interface BranchComponent {
    <T> T accept(BranchVisitor<T> visitor);
}