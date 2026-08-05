import { Core } from 'cytoscape';
import { getCssVar } from '../../../services/theme.service';

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
        'width': 44,
        'height': 44,
        'background-color': '#ffffff', // white fill to make black SVG lines visible
        'background-opacity': 1,
        'border-width': 2,
        'border-color': '#2A2F3A', // dark neutral border
        'border-opacity': 1,

        // hardcoded: CSS vars unsupported in Cytoscape SVG data URIs
        // base64-encoded; viewBox="10 10 80 80" crops tight to the circle edge so contain fills the node
        'background-image': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMTAgMTAgODAgODAiPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjM4IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIvPjxwYXRoIGQ9Ik0xOC40IDI4LjkgTDgxLjYgNzEuMSBNMjcuMyAxOS41IEw4Ni45IDU5LjIgTTEzLjEgNDAuOCBMNzIuNyA4MC41IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMi41IiBmaWxsPSJub25lIi8+PC9zdmc+',
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

        'shape': 'ellipse',
        'width': 44,
        'height': 44,
        'background-color': '#ffffff', // white fill to make black SVG lines visible
        'background-opacity': 1,
        'border-width': 2,
        'border-color': '#2A2F3A', // dark neutral border
        'border-opacity': 1,

        // hardcoded: CSS vars unsupported in Cytoscape SVG data URIs
        // base64-encoded; IEC 60617 "Device, Functional unit, Component, Function" box (form 1)
        'background-image': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMTUgMjUgNzAgNTAiPjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIvPjwvc3ZnPg==',
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
        'width': 44,
        'height': 44,
        'background-color': '#ffffff', // white fill to make black SVG lines visible
        'background-opacity': 1,
        'border-width': 2,
        'border-color': '#2A2F3A', // dark neutral border
        'border-opacity': 1,

        // hardcoded: CSS vars unsupported in Cytoscape SVG data URIs
        // base64-encoded; IEC 60617 filled dot — T-connection / junction-box convention
        'background-image': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iNDAgNDAgMjAgMjAiPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjciIGZpbGw9IiMwMDAwMDAiLz48L3N2Zz4=',
        'background-fit': 'contain',
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
    'background-color': '#FFFFFF',
    'border-color': '#2A2F3A',
  } as any);

  style.selector('node[type="CONSUMER"]').style({
    'color': textSecondary,
    'background-color': '#FFFFFF',
    'border-color': '#2A2F3A',
  } as any);

  style.selector('node[type="JUNCTION"]').style({
    'color': textSecondary,
    'background-color': '#FFFFFF',
    'border-color': '#2A2F3A',
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
