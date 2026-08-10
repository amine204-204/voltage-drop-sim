package com.etap.voltagedrop.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class NetworkGraph {
    private List<NetworkNode> nodes = new ArrayList<>();
    private List<NetworkBranch> branches = new ArrayList<>();
    private String rootSubstationId;

    public void addNode(NetworkNode node) {
        this.nodes.add(node);
        if (node.isSource()) {
            this.rootSubstationId = node.getId();
        }
    }

    public void addBranch(NetworkBranch branch) {
        this.branches.add(branch);
    }

    public NetworkNode getNodeById(String id) {
        return nodes.stream().filter(n -> n.getId().equals(id)).findFirst().orElse(null);
    }

    public NetworkBranch getBranchById(String id) {
        return branches.stream().filter(b -> b.getId().equals(id)).findFirst().orElse(null);
    }

    public NetworkBranch getIncomingBranch(String nodeId) {
        return branches.stream().filter(b -> b.getToNodeId().equals(nodeId)).findFirst().orElse(null);
    }

    public List<NetworkNode> getChildNodes(String parentId) {
        return branches.stream()
                .filter(b -> b.getFromNodeId().equals(parentId))
                .map(b -> getNodeById(b.getToNodeId()))
                .toList();
    }
}