package com.etap.voltagedrop.service;

import com.etap.voltagedrop.domain.NetworkGraph;
import com.etap.voltagedrop.domain.NetworkNode;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class GraphValidationService {

    public void validateRadialTree(NetworkGraph graph) {
        if (graph.getNodes().isEmpty()) {
            throw new IllegalArgumentException("Graph cannot be empty.");
        }

        // 1. Check for exactly ONE source
        long sourceCount = graph.getNodes().stream().filter(NetworkNode::isSource).count();
        if (sourceCount != 1) {
            throw new IllegalArgumentException("Invalid topology: Graph must contain exactly one root Substation (Source). Found: " + sourceCount);
        }

        // 2. Check tree structure property: Edges = Nodes - 1
        if (graph.getBranches().size() != graph.getNodes().size() - 1) {
            throw new IllegalArgumentException("Invalid topology: A radial tree must have exactly (Nodes - 1) branches. This graph may contain loops.");
        }

        // 3. Check for connectivity and multiple parents (meshed loops) via DFS
        Set<String> visitedNodes = new HashSet<>();
        String rootId = graph.getRootSubstationId();

        if (rootId == null) {
            throw new IllegalArgumentException("Invalid topology: Root substation ID is missing.");
        }

        depthFirstSearch(graph, rootId, visitedNodes);

        if (visitedNodes.size() != graph.getNodes().size()) {
            throw new IllegalArgumentException("Invalid topology: The graph is disconnected. Not all nodes are reachable from the substation.");
        }
    }

    private void depthFirstSearch(NetworkGraph graph, String currentId, Set<String> visitedNodes) {
        if (visitedNodes.contains(currentId)) {
            return;
        }
        visitedNodes.add(currentId);

        for (NetworkNode child : graph.getChildNodes(currentId)) {
            depthFirstSearch(graph, child.getId(), visitedNodes);
        }
    }
}