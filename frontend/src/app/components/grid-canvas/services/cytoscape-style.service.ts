import { Core } from 'cytoscape';
import { getCssVar } from '../../../services/theme.service';

// hardcoded: CSS vars unsupported in Cytoscape SVG data URIs, so the symbol color is
// baked into the base64 SVG at build/sync time — it matches the branch/edge color (--edge-color)
// so node symbols stay consistent with the cables, and the value still follows the theme.
function buildSymbolDataUri(kind: 'SOURCE' | 'CONSUMER' | 'JUNCTION', color: string): string {
  const svg =
    kind === 'SOURCE'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="10 10 80 80"><circle cx="50" cy="50" r="38" fill="none" stroke="${color}" stroke-width="4"/><path d="M19 28 L41.6 13 M12.7 42.9 L57.8 12.8 M12.2 53.9 L68.1 16.6 M14.3 63.1 L75.8 22.1 M18.4 71.1 L81.6 28.9 M24.2 77.9 L85.7 36.9 M31.9 83.4 L87.8 46.1 M42.2 87.2 L87.3 57.1 M58.4 87.1 L81 72" stroke="${color}" stroke-width="2.5" fill="none"/></svg>`
      : kind === 'CONSUMER'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="20 20 60 60"><rect x="20" y="20" width="60" height="60" fill="none" stroke="${color}" stroke-width="4"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="43 43 14 14"><circle cx="50" cy="50" r="7" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function getSymbolColor(): string {
  return getCssVar('--edge-color', '#A3B1C6');
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

        'shape': 'ellipse',
        'width': 60,
        'height': 60,
        'background-color': '#000000',
        'background-opacity': 0, // Cytoscape paints alpha-0 colors as opaque black; use opacity to hide the fill
        'border-width': 0,
        'border-color': '#2A2F3A', // dark neutral border
        'border-opacity': 1,

        // hardcoded: CSS vars unsupported in Cytoscape SVG data URIs
        // base64-encoded; viewBox="10 10 80 80" crops tight to the circle edge so contain fills the node
        'background-image': buildSymbolDataUri('SOURCE', getSymbolColor()),
        'background-fit': 'contain',
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
        'color': '#8891A0', // var(--text-secondary)
        'font-size': '10px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': 500,

        'shape': 'rectangle',
        'width': 60, // square node matches the square box symbol so contain fills it edge-to-edge
        'height': 60,
        'background-color': '#000000',
        'background-opacity': 0, // Cytoscape paints alpha-0 colors as opaque black; use opacity to hide the fill
        'border-width': 0,
        'border-color': '#2A2F3A', // dark neutral border
        'border-opacity': 1,

        // hardcoded: CSS vars unsupported in Cytoscape SVG data URIs
        // base64-encoded; IEC 60617 "Device, Functional unit, Component, Function" box (form 1)
        'background-image': buildSymbolDataUri('CONSUMER', getSymbolColor()),
        'background-fit': 'contain',
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
        'color': '#8891A0', // var(--text-secondary)
        'font-size': '10px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': 500,

        'shape': 'ellipse',
        'width': 8, // matches the 14:14 dot viewBox so the filled dot fills the node edge-to-edge
        'height': 8,
        'background-color': '#000000',
        'background-opacity': 0, // Cytoscape paints alpha-0 colors as opaque black; use opacity to hide the fill
        'border-width': 0,
        'border-color': '#2A2F3A', // dark neutral border
        'border-opacity': 1,

        // hardcoded: CSS vars unsupported in Cytoscape SVG data URIs
        // base64-encoded; IEC 60617 filled dot — T-connection / junction-box convention
        'background-image': buildSymbolDataUri('JUNCTION', getSymbolColor()),
        'background-fit': 'contain',
      } as any
    },

    // === EDGES: Default ===
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#A3B1C6', // var(--edge-color)
        'line-opacity': 0.8,
        'curve-style': 'bezier',
        'control-point-step-size': 40,

        'target-arrow-shape': 'none',

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

    // === LABELS: only on edges that have lengthLabel defined ===
    {
      selector: 'edge[lengthLabel]',
      style: {
        'label': 'data(lengthLabel)',
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
        'line-style': 'solid',
        'width': 3,
      } as any
    },
    {
      selector: 'edge[branchType = "SWITCH"]',
      style: {
        'line-color': '#3FBF7F', // var(--status-ok) for closed
        'line-opacity': 0,
        'width': 2,
        'label': 'data(lengthLabel)',
        'text-rotation': 'autorotate',
        'text-margin-y': 12,
      } as any
    },
    {
      selector: 'edge[branchType = "SWITCH"][?closed]',
      style: {
        'line-color': '#3FBF7F',
        'line-style': 'solid',
        'line-opacity': 0,
      } as any
    },
    {
      selector: 'edge[branchType = "SWITCH"][!closed]',
      style: {
        'line-color': '#E8615D',
        'line-style': 'solid',
        'line-opacity': 0
      } as any
    },

    // === SIMULATION STATES ===
    // Kept last so they win over :selected and branch-type rules (equal specificity, order decides)
    {
      selector: 'node.sim-node-violation',
      style: {
        'border-width': 4,
        'border-color': '#E8615D', // var(--status-danger)
        'border-opacity': 1,
      } as any
    },
    {
      selector: 'edge.sim-ok',
      style: {
        'line-color': '#3FBF7F', // var(--status-ok)
        'width': 4,
        'line-opacity': 0.9,
      } as any
    },
    {
      selector: 'edge.sim-violation',
      style: {
        'line-color': '#E8615D', // var(--status-danger)
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
        'width': 6,
        'line-opacity': 1,
      } as any
    },

    // === CABLE SIZING SUGGESTION ===
    // Amber (accent) = recommended fix target, deliberately distinct from the red compliance
    // symptom and the cyan report focus. Dashed = proposed, solid = applied by the engineer.
    {
      selector: 'edge.sim-sizing',
      style: {
        'line-color': '#E8A33D', // var(--accent)
        'line-style': 'dashed',
        'line-dash-pattern': [8, 6],
        'width': 6,
        'line-opacity': 1,
        'z-index': 200,
      } as any
    },
    {
      selector: 'edge.sim-applied',
      style: {
        'line-color': '#F4B75A', // var(--accent-strong)
        'line-style': 'solid',
        'width': 6,
        'line-opacity': 1,
        'z-index': 200,
      } as any
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#E8A33D',
        'width': 4,
        'line-opacity': 1,
      } as any
    },

    {
      selector: 'edge[branchType = "TRANSFORMER"]:selected, edge[branchType = "SWITCH"]:selected',
      style: {
        'line-opacity': 0,
      } as any
    },
    {
      selector: 'edge[branchType = "TRANSFORMER"]:active, edge[branchType = "SWITCH"]:active',
      style: {
        'line-opacity': 0,
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
  const edgeColor = getCssVar('--edge-color', '#A3B1C6');
  const bgCanvas = getCssVar('--bg-canvas', '#12161C');
  const accentStrong = getCssVar('--accent-strong', '#F4B75A');
  const statusOk = getCssVar('--status-ok', '#3FBF7F');

  const style = cy.style();

  style.selector('node[type="SOURCE"]').style({
    'color': textSecondary,
    'background-color': '#000000',
    'background-opacity': 0,
    'border-color': 'transparent',
    'background-image': buildSymbolDataUri('SOURCE', getSymbolColor()),
  } as any);

  style.selector('node[type="CONSUMER"]').style({
    'color': textSecondary,
    'background-color': '#000000',
    'background-opacity': 0,
    'border-color': 'transparent',
    'background-image': buildSymbolDataUri('CONSUMER', getSymbolColor()),
  } as any);

  style.selector('node[type="JUNCTION"]').style({
    'color': textSecondary,
    'background-color': '#000000',
    'background-opacity': 0,
    'border-color': 'transparent',
    'background-image': buildSymbolDataUri('JUNCTION', getSymbolColor()),
  } as any);

  style.selector('edge[branchType = "TRANSFORMER"]').style({
    'line-color': dataCyan,
    'width': 3,
    'line-opacity': 0,
  } as any);

  style.selector('edge[branchType = "SWITCH"]').style({
    'line-color': statusOk,
    'width': 2,
    'line-opacity': 0,
  } as any);

  style.selector('edge[branchType = "SWITCH"][?closed]').style({
    'line-color': statusOk,
    'line-style': 'solid',
    'line-opacity': 0,
  } as any);

  style.selector('edge[branchType = "SWITCH"][!closed]').style({
    'line-color': statusDanger,
    'line-style': 'solid',
    'line-opacity': 0,
  } as any);

  style.selector('edge').style({
    'line-color': edgeColor,
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

  style.selector('node.sim-node-violation').style({
    'border-width': 4,
    'border-color': statusDanger,
    'border-opacity': 1,
  } as any);

  style.selector('edge.sim-ok').style({
    'line-color': statusOk,
  } as any);

  style.selector('edge.sim-violation').style({
    'line-color': statusDanger,
  } as any);

  style.selector('node.report-focus').style({
    'border-color': dataCyan,
  } as any);

  style.selector('edge.report-focus').style({
    'line-color': dataCyan,
    'width': 6,
    'line-opacity': 1,
  } as any);

  style.selector('edge.sim-sizing').style({
    'line-color': accent,
    'line-style': 'dashed',
    'line-dash-pattern': [8, 6],
    'width': 6,
    'line-opacity': 1,
    'z-index': 200,
  } as any);

  style.selector('edge.sim-applied').style({
    'line-color': accentStrong,
    'line-style': 'solid',
    'width': 6,
    'line-opacity': 1,
    'z-index': 200,
  } as any);

  style.selector('edge:selected').style({
    'line-color': accent,
    'width': 4,
    'line-opacity': 1,
  } as any);
  style.selector('edge[branchType = "TRANSFORMER"]:selected, edge[branchType = "SWITCH"]:selected').style({
    'line-opacity': 0,
  } as any);
  style.selector('edge[branchType = "TRANSFORMER"]:active, edge[branchType = "SWITCH"]:active').style({
    'line-opacity': 0,
  } as any);

  style.update();
}
