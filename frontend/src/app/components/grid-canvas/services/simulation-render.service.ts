import { Core } from 'cytoscape';
import { SimulationResponseDto } from '../../../models/simulation.model';

export function applySimulationResults(cy: Core, response: SimulationResponseDto): void {
  cy.elements().forEach((el: any) => { el.removeData('simulationData'); });
  cy.edges().removeClass('sim-ok sim-violation');

  response.branches.forEach(branch => {
    const cyEdge = cy.$('#' + branch.id);

    if (cyEdge.length > 0) {
      const initialStatus = branch.statusTimeSeries[0];
      cyEdge.addClass(initialStatus === 'VIOLATION' ? 'sim-violation' : 'sim-ok');

      cyEdge.data('simulationData', branch);
    }
  });

  response.nodes.forEach(node => {
    const cyNode = cy.$('#' + node.id);

    if (cyNode) {
      cyNode.data('simulationData', node);
    }
  });

  cy.elements().unselect();
}

export function updateTimeStep(cy: Core, step: number): void {
  cy.edges().removeClass('sim-ok sim-violation');

  cy.edges().forEach(edge => {
    const simData = edge.data('simulationData');
    if (simData && simData.statusTimeSeries) {
      const status = simData.statusTimeSeries[step];
      edge.addClass(status === 'VIOLATION' ? 'sim-violation' : 'sim-ok');
    }
  });
}
