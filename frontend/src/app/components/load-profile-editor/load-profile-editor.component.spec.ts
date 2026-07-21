import { describe, it, expect } from 'vitest';
import { LoadProfileEditor, ControlPoint } from './load-profile-editor.component';

describe('LoadProfileEditor.getProfileFromControlPoints', () => {
  it('returns array of correct length', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 50 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result).toHaveLength(10);
  });

  it('returns all zeros for zero-value control points', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 0 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result.every(v => v === 0)).toBe(true);
  });

  it('interpolates linearly between two control points', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 100 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result[0]).toBeCloseTo(0, 0);
    expect(result[9]).toBeCloseTo(100, 0);
  });

  it('handles single step', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 42 },
      { time: 0, value: 42 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 1, 1, 100);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for zero totalSteps', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 9, value: 50 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 0, 1, 100);
    expect(result).toHaveLength(0);
  });

  it('handles flat profile (constant load)', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 50 },
      { time: 9, value: 50 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result.every(v => Math.abs(v - 50) < 5)).toBe(true);
  });

  it('handles three control points (peak in middle)', () => {
    const points: ControlPoint[] = [
      { time: 0, value: 0 },
      { time: 4.5, value: 100 },
      { time: 9, value: 0 },
    ];
    const result = LoadProfileEditor.getProfileFromControlPoints(points, 10, 1, 100);
    expect(result).toHaveLength(10);
    const midIndex = Math.floor(result.length / 2);
    expect(result[midIndex]).toBeGreaterThan(result[0]);
  });
});
