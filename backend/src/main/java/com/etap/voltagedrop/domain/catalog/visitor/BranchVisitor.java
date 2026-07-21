package com.etap.voltagedrop.domain.catalog.visitor;

import com.etap.voltagedrop.domain.catalog.CableSpec;
import com.etap.voltagedrop.domain.catalog.SwitchSpec;
import com.etap.voltagedrop.domain.catalog.TransformerSpec;

public interface BranchVisitor<T> {
    T visitCable(CableSpec cable);
    T visitTransformer(TransformerSpec transformer);
    T visitSwitch(SwitchSpec sw);
}
