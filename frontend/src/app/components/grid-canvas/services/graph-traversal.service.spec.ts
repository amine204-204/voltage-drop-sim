import { describe, it, expect } from 'vitest';
import cytoscape from 'cytoscape';
import { getIslands, getNominalVoltageForNode } from './graph-traversal.service';

function createCy(elements: any[]) {
  return cytoscape({ elements, headless: true });
}

describe('getIslands', () => {
  it('returns empty array for empty graph', () => {
    const cy = createCy([]);
    expect(getIslands(cy)).toEqual([]);
  });

  it('returns single island for connected graph', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE', nominalVoltage: 230 } },
      { data: { id: 'n2', label: 'Load 1', type: 'CONSUMER', loadType: 'CONSTANT_POWER', cosPhi: 0.95 } },
      { data: { id: 'e1', source: 'n1', target: 'n2', lengthInKm: 0.1, componentCrossSection: '16mm2', componentMaterial: 'CU' } },
    ]);

    const islands = getIslands(cy);
    expect(islands).toHaveLength(1);
    expect(islands[0].nodes).toHaveLength(2);
    expect(islands[0].branches).toHaveLength(1);
  });

  it('detects two separate islands', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE', nominalVoltage: 230 } },
      { data: { id: 'n2', label: 'Load 1', type: 'CONSUMER' } },
      { data: { id: 'e1', source: 'n1', target: 'n2', lengthInKm: 0.1, componentCrossSection: '16mm2', componentMaterial: 'CU' } },
      { data: { id: 'n3', label: 'Sub 2', type: 'SOURCE', nominalVoltage: 400 } },
      { data: { id: 'n4', label: 'Load 2', type: 'CONSUMER' } },
      { data: { id: 'e2', source: 'n3', target: 'n4', lengthInKm: 0.5, componentCrossSection: '16mm2', componentMaterial: 'CU' } },
    ]);

    const islands = getIslands(cy);
    expect(islands).toHaveLength(2);
    expect(islands[0].nodes).toHaveLength(2);
    expect(islands[1].nodes).toHaveLength(2);
  });

  it('handles isolated nodes as separate islands', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE', nominalVoltage: 230 } },
      { data: { id: 'n2', label: 'Bus 1', type: 'JUNCTION' } },
    ]);

    const islands = getIslands(cy);
    expect(islands).toHaveLength(2);
    expect(islands[0].nodes).toHaveLength(1);
    expect(islands[1].nodes).toHaveLength(1);
  });

  it('maps node fields correctly', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE', nominalVoltage: 230 } },
    ]);

    const islands = getIslands(cy);
    const node = islands[0].nodes[0];
    expect(node.id).toBe('n1');
    expect(node.name).toBe('Sub 1');
    expect(node.type).toBe('SOURCE');
    expect(node.nominalVoltage).toBe(230);
  });

  it('maps branch fields correctly', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE' } },
      { data: { id: 'n2', label: 'Load 1', type: 'CONSUMER' } },
      { data: { id: 'e1', source: 'n1', target: 'n2', lengthInKm: 0.25, componentCrossSection: '25mm2', componentMaterial: 'AL' } },
    ]);

    const islands = getIslands(cy);
    const branch = islands[0].branches[0];
    expect(branch.id).toBe('e1');
    expect(branch.fromNodeId).toBe('n1');
    expect(branch.toNodeId).toBe('n2');
    expect(branch.lengthInKm).toBe(0.25);
    expect(branch.componentCrossSection).toBe('25mm2');
    expect(branch.componentMaterial).toBe('AL');
  });

  it('applies default values for missing branch fields', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE' } },
      { data: { id: 'n2', label: 'Load 1', type: 'CONSUMER' } },
      { data: { id: 'e1', source: 'n1', target: 'n2' } },
    ]);

    const islands = getIslands(cy);
    const branch = islands[0].branches[0];
    expect(branch.lengthInKm).toBe(0.1);
    expect(branch.componentCrossSection).toBe('16mm2');
    expect(branch.componentMaterial).toBe('CU');
  });
});

describe('getNominalVoltageForNode', () => {
  it('returns nominal voltage from SOURCE ancestor', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE', nominalVoltage: 400 } },
      { data: { id: 'n2', label: 'Bus 1', type: 'JUNCTION' } },
      { data: { id: 'n3', label: 'Load 1', type: 'CONSUMER' } },
      { data: { id: 'e1', source: 'n1', target: 'n2', lengthInKm: 0.1, componentCrossSection: '16mm2', componentMaterial: 'CU' } },
      { data: { id: 'e2', source: 'n2', target: 'n3', lengthInKm: 0.1, componentCrossSection: '16mm2', componentMaterial: 'CU' } },
    ]);

    expect(getNominalVoltageForNode(cy, 'n3')).toBe(400);
  });

  it('returns 230 default when no SOURCE found', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Load 1', type: 'CONSUMER' } },
    ]);

    expect(getNominalVoltageForNode(cy, 'n1')).toBe(230);
  });

  it('returns 230 for non-existent node', () => {
    const cy = createCy([]);
    expect(getNominalVoltageForNode(cy, 'nonexistent')).toBe(230);
  });

  it('returns 230 when SOURCE has no nominalVoltage set', () => {
    const cy = createCy([
      { data: { id: 'n1', label: 'Sub 1', type: 'SOURCE' } },
      { data: { id: 'n2', label: 'Load 1', type: 'CONSUMER' } },
      { data: { id: 'e1', source: 'n1', target: 'n2', lengthInKm: 0.1, componentCrossSection: '16mm2', componentMaterial: 'CU' } },
    ]);

    expect(getNominalVoltageForNode(cy, 'n2')).toBe(230);
  });
});
