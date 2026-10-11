package com.etap.voltagedrop.service.visitor;

import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;
import com.etap.voltagedrop.domain.catalog.visitor.BranchVisitor;

public class ConductivityVisitor implements BranchVisitor<Boolean> {

    @Override
    public Boolean visitCable(CableSpec cable) {
        return true;
    }

    @Override
    public Boolean visitTransformer(TransformerSpec transformer) {
        return true;
    }

    @Override
    public Boolean visitSwitch(SwitchSpec sw) {
        return sw.isClosed();
    }
}
