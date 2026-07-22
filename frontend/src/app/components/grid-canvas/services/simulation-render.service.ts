import { Core } from 'cytoscape';
import { SimulationResponseDto } from '../../../models/simulation.model';
import { getCssVar } from '../../../services/theme.service';

export function applySimulationResults(cy: Core, response: SimulationResponseDto): void {
  const statusDanger = getCssVar('--status-danger', '#E8615D');
  const statusOk = getCssVar('--status-ok', '#3FBF7F');

  cy.elements().forEach((el: any) => { el.removeData('simulationData'); });
  cy.edges().forEach(edge => {
    edge.style('line-color', '');
    edge.style('target-arrow-color', '');
    edge.style('width', '');
  });

  response.branches.forEach(branch => {
    const cyEdge = cy.$('#' + branch.id);

    if (cyEdge.length > 0) {
      const initialStatus = branch.statusTimeSeries[0];

      if (initialStatus === 'VIOLATION') {
        cyEdge.style({
          'line-color': statusDanger,
          'target-arrow-color': statusDanger,
          'width': 6
        });
      } else {
        cyEdge.style({
          'line-color': statusOk,
          'target-arrow-color': statusOk,
          'width': 4
        });
      }

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
  const statusDanger = getCssVar('--status-danger', '#E8615D');
  const statusOk = getCssVar('--status-ok', '#3FBF7F');

  cy.edges().forEach(edge => {
    const simData = edge.data('simulationData');
    if (simData && simData.statusTimeSeries) {
      const status = simData.statusTimeSeries[step];

      if (status === 'VIOLATION') {
        edge.style({
          'line-color': statusDanger,
          'target-arrow-color': statusDanger,
          'width': 5,
          'line-opacity': 1,
        });
      } else {
        edge.style({
          'line-color': statusOk,
          'target-arrow-color': statusOk,
          'width': 3,
          'line-opacity': 0.9,
        });
      }
    }
  });
}
