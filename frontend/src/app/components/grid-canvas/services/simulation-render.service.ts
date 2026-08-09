import { Core, EdgeSingular } from 'cytoscape';
import { SimulationResponseDto, SimulationNodeResult } from '../../../models/simulation.model';

export function applySimulationResults(cy: Core, response: SimulationResponseDto): void {
  cy.elements().forEach((el: any) => { el.removeData('simulationData'); });
  cy.edges().removeClass('sim-ok sim-violation');
  cy.nodes().removeClass('sim-node-violation');

  response.nodes.forEach(node => {
    const cyNode = cy.$('#' + node.id);
    if (cyNode.length > 0) {
      cyNode.data('simulationData', node);
    }
  });

  response.branches.forEach(branch => {
    const cyEdge = cy.$('#' + branch.id);
    if (cyEdge.length > 0) {
      cyEdge.data('simulationData', branch);
    }
  });

  colorForStep(cy, 0);

  cy.elements().unselect();
}

export function updateTimeStep(cy: Core, step: number): void {
  colorForStep(cy, step);
}

/* Coloring rule (single source of truth):
   - Only CONSUMER nodes carry a compliance status; junctions and the source have none.
   - An edge is RED iff it lies on the path of at least one violating consumer at this step
     (in a radial tree, `edge.id ∈ consumer.pathBranches` means the consumer is downstream).
   - The violating consumer node itself gets a red indicator.
   - Everything else is green (no downstream violation). */
function colorForStep(cy: Core, step: number): void {
  cy.edges().removeClass('sim-ok sim-violation');
  cy.nodes().removeClass('sim-node-violation');

  const violatingPathEdgeIds = new Set<string>();

  cy.nodes().forEach(node => {
    const simData = node.data('simulationData') as SimulationNodeResult | undefined;
    if (!simData || (simData.type && simData.type !== 'CONSUMER')) return;
    if (!Array.isArray(simData.statusTimeSeries) || step >= simData.statusTimeSeries.length) return;
    if (simData.statusTimeSeries[step] !== 'VIOLATION') return;

    node.addClass('sim-node-violation');

    for (const pb of simData.pathBranches || []) {
      violatingPathEdgeIds.add(pb.branchId);
    }
  });

  cy.edges().forEach(edge => {
    edge.addClass(violatingPathEdgeIds.has(edge.id()) ? 'sim-violation' : 'sim-ok');
  });
}

/* Edge status for the property panel: VIOLATION iff the edge feeds a violating consumer at this step. */
export function getEdgeStatusAt(edge: EdgeSingular, step: number): string | undefined {
  let status: string | undefined = undefined;

  edge.cy().nodes().forEach(node => {
    if (status === 'VIOLATION') return;
    const simData = node.data('simulationData') as SimulationNodeResult | undefined;
    if (!simData || (simData.type && simData.type !== 'CONSUMER')) return;
    if (!Array.isArray(simData.statusTimeSeries) || step >= simData.statusTimeSeries.length) return;
    if (simData.statusTimeSeries[step] !== 'VIOLATION') return;

    const inPath = (simData.pathBranches || []).some(pb => pb.branchId === edge.id());
    if (inPath) status = 'VIOLATION';
  });

  return status ?? 'OK';
}
