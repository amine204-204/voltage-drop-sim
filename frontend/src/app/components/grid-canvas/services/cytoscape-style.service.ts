import { Core } from 'cytoscape';
import { getCssVar } from '../../../services/theme.service';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export function getCytoscapeStyles(): any[] {
  return [
    // === NODES: SOURCE (Substation) ===
    {
      selector: 'node[type="SOURCE"]',
      style: {
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'color': '#8891A0', // var(--text-secondary)
        'font-size': '10px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': 500,

        'shape': 'round-rectangle',
        'width': 44,
        'height': 44,
        'background-color': 'rgba(232, 97, 93, 0.14)', // var(--status-danger-bg)
        'background-opacity': 1,
        'border-width': 2,
        'border-color': '#E8615D', // var(--status-danger)
        'border-opacity': 0.8,

        'background-image': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23E8615D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
        'background-width': '60%',
        'background-height': '60%',
        'background-position-x': '50%',
        'background-position-y': '50%',
        'background-fit': 'none',
        'background-clip': 'none',
      } as any
    },

    // === NODES: CONSUMER (Load) ===
    {
      selector: 'node[type="CONSUMER"]',
      style: {
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'color': '#8891A0',
        'font-size': '10px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': 500,

        'shape': 'ellipse',
        'width': 36,
        'height': 36,
        'background-color': 'rgba(232, 163, 61, 0.14)', // var(--accent-dim)
        'background-opacity': 1,
        'border-width': 2,
        'border-color': '#E8A33D', // var(--accent)
        'border-opacity': 0.7,

        'background-image': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23E8A33D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
        'background-width': '55%',
        'background-height': '55%',
        'background-position-x': '50%',
        'background-position-y': '50%',
        'background-fit': 'none',
      } as any
    },

    // === NODES: JUNCTION (Busbar) ===
    {
      selector: 'node[type="JUNCTION"]',
      style: {
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'color': '#8891A0',
        'font-size': '9px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': 500,

        'shape': 'diamond',
        'width': 28,
        'height': 28,
        'background-color': 'rgba(79, 184, 208, 0.12)',
        'background-opacity': 1,
        'border-width': 2,
        'border-color': '#4FB8D0', // var(--data-cyan)
        'border-opacity': 0.6,

        'background-image': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234FB8D0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v7M12 15v7M2 12h7M15 12h7"/></svg>',
        'background-width': '55%',
        'background-height': '55%',
        'background-position-x': '50%',
        'background-position-y': '50%',
        'background-fit': 'none',
      } as any
    },

    // === EDGES: Default ===
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#7A8CA0', // var(--edge-color)
        'line-opacity': 0.8,
        'curve-style': 'bezier',
        'control-point-step-size': 40,

        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#7A8CA0',
        'target-arrow-width': 8,
        'arrow-scale': 0.8,

        'label': 'data(lengthLabel)',
        'font-size': '8px',
        'color': '#8891A0', // var(--text-secondary)
        'text-background-color': '#12161C', // var(--bg-canvas)
        'text-background-opacity': 0.9,
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle',
        'transition-property': 'line-color, border-color, background-color, width',
        'transition-duration': '0.2s',
      } as any
    },

    // === SELECTION ===
    {
      selector: 'node:selected',
      style: {
        'border-width': 3,
        'border-color': '#E8A33D', // var(--accent)
        'border-opacity': 1,
        'background-blacken': -0.1,
      } as any
    },

    // === HOVER ===
    {
      selector: 'node:active',
      style: {
        'border-width': 3,
        'border-color': '#F4B75A', // var(--accent-strong)
        'border-opacity': 0.8,
      } as any
    },
    {
      selector: 'edge:active',
      style: {
        'line-color': 'rgba(232, 163, 61, 0.14)',
        'width': 4,
      } as any
    },

    // === BRANCH TYPES ===
    {
      selector: 'edge[branchType = "TRANSFORMER"]',
      style: {
        'line-color': '#4FB8D0', // var(--data-cyan)
        'target-arrow-color': '#4FB8D0',
        'line-style': 'dashed',
        'line-dash-pattern': [8, 4],
        'width': 3,
        'label': 'data(lengthLabel)',
        'text-rotation': 'autorotate',
      } as any
    },
    {
      selector: 'edge[branchType = "SWITCH"]',
      style: {
        'line-color': '#3FBF7F', // var(--status-ok) for closed
        'target-arrow-color': '#3FBF7F',
        'width': 2,
        'label': 'data(lengthLabel)',
      } as any
    },
    {
      selector: 'edge[branchType = "SWITCH"][?closed]',
      style: {
        'line-color': '#3FBF7F',
        'target-arrow-color': '#3FBF7F',
        'line-style': 'solid',
      } as any
    },
    {
      selector: 'edge[branchType = "SWITCH"][!closed]',
      style: {
        'line-color': '#E8615D',
        'target-arrow-color': '#E8615D',
        'line-style': 'dotted',
        'line-dash-pattern': [4, 4],
      } as any
    },

    // === SIMULATION STATES ===
    // Kept last so they win over :selected and branch-type rules (equal specificity, order decides)
    {
      selector: 'edge.sim-ok',
      style: {
        'line-color': '#3FBF7F', // var(--status-ok)
        'target-arrow-color': '#3FBF7F',
        'width': 4,
        'line-opacity': 0.9,
      } as any
    },
    {
      selector: 'edge.sim-violation',
      style: {
        'line-color': '#E8615D', // var(--status-danger)
        'target-arrow-color': '#E8615D',
        'width': 5,
        'line-opacity': 1,
      } as any
    },

    // === REPORT FOCUS ===
    // Transient emphasis applied when an issue is clicked in the report panel.
    {
      selector: 'node.report-focus',
      style: {
        'border-width': 4,
        'border-color': '#4FB8D0', // var(--data-cyan)
        'border-opacity': 1,
        'transition-property': 'border-color, border-width',
        'transition-duration': '0.3s',
      } as any
    },
    {
      selector: 'edge.report-focus',
      style: {
        'line-color': '#4FB8D0', // var(--data-cyan)
        'target-arrow-color': '#4FB8D0',
        'width': 6,
        'line-opacity': 1,
      } as any
    },

    // === SELECTED EDGE ===
    // Kept last so selection highlight wins over branch-type and sim classes while selected;
    // sim colors (classes) return automatically on deselect.
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#E8A33D',
        'target-arrow-color': '#E8A33D',
        'width': 4,
        'line-opacity': 1,
      } as any
    },
  ];
}

export function syncCytoscapeTheme(cy: Core): void {
  const textSecondary = getCssVar('--text-secondary', '#8891A0');
  const statusDangerBg = getCssVar('--status-danger-bg', 'rgba(232, 97, 93, 0.14)');
  const statusDanger = getCssVar('--status-danger', '#E8615D');
  const accentDim = getCssVar('--accent-dim', 'rgba(232, 163, 61, 0.14)');
  const accent = getCssVar('--accent', '#E8A33D');
  const dataCyan = getCssVar('--data-cyan', '#4FB8D0');
  const edgeColor = getCssVar('--edge-color', '#7A8CA0');
  const bgCanvas = getCssVar('--bg-canvas', '#12161C');
  const accentStrong = getCssVar('--accent-strong', '#F4B75A');
  const statusOk = getCssVar('--status-ok', '#3FBF7F');

  const style = cy.style();

  style.selector('node[type="SOURCE"]').style({
    'color': textSecondary,
    'background-color': statusDangerBg,
    'border-color': statusDanger,
  } as any);

  style.selector('node[type="CONSUMER"]').style({
    'color': textSecondary,
    'background-color': accentDim,
    'border-color': accent,
  } as any);

  style.selector('node[type="JUNCTION"]').style({
    'color': textSecondary,
    'background-color': `rgba(${hexToRgb(dataCyan)}, 0.12)`,
    'border-color': dataCyan,
  } as any);

  style.selector('edge').style({
    'line-color': edgeColor,
    'target-arrow-color': edgeColor,
    'color': textSecondary,
    'text-background-color': bgCanvas,
  } as any);

  style.selector('node:selected').style({
    'border-color': accent,
  } as any);

  style.selector('node:active').style({
    'border-color': accentStrong,
  } as any);

  style.selector('edge:active').style({
    'line-color': accentDim,
  } as any);

  style.selector('edge.sim-ok').style({
    'line-color': statusOk,
    'target-arrow-color': statusOk,
  } as any);

  style.selector('edge.sim-violation').style({
    'line-color': statusDanger,
    'target-arrow-color': statusDanger,
  } as any);

  style.selector('node.report-focus').style({
    'border-color': dataCyan,
  } as any);

  style.selector('edge.report-focus').style({
    'line-color': dataCyan,
    'target-arrow-color': dataCyan,
  } as any);

  style.selector('edge:selected').style({
    'line-color': accent,
    'target-arrow-color': accent,
  } as any);

  style.update();
}
